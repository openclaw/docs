---
read_when:
    - 你正在建置一個 OpenClaw 外掛
    - 你需要交付外掛設定結構描述，或偵錯外掛驗證錯誤
summary: 外掛資訊清單 + JSON 結構描述需求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-05T11:31:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 400c67c01c551b23bd12c236b9f0d93f12316c284ff1e5f7b103bdb5abf882f2
    source_path: plugins/manifest.md
    workflow: 16
---

本頁說明 **OpenClaw 原生外掛資訊清單** `openclaw.plugin.json`。如需相容的套件組合版面配置（Codex、Claude、Cursor），請參閱[外掛套件組合](/zh-TW/plugins/bundles)。

相容的套件組合格式會改用各自的資訊清單檔案：

- Codex 套件組合：`.codex-plugin/plugin.json`
- Claude 套件組合：`.claude-plugin/plugin.json`，或是不含資訊清單的預設 Claude 元件版面配置
- Cursor 套件組合：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些版面配置，但不會用下方的 `openclaw.plugin.json` 結構描述驗證它們。對於相容的套件組合，當版面配置符合 OpenClaw 的執行階段預期時，OpenClaw 會讀取套件組合中繼資料、宣告的技能根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的鉤子套件。

每個原生 OpenClaw 外掛都**必須**在**外掛根目錄**中提供 `openclaw.plugin.json`。OpenClaw 會讀取它，以便在**不執行外掛程式碼**的情況下驗證設定。缺少資訊清單或資訊清單無效，會阻擋設定驗證，並被視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需原生能力模型和目前的外部相容性指引，請參閱[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。其中所有內容都必須足夠輕量，能在不啟動外掛執行階段的情況下檢查。

**用途：**

- 外掛身分、設定驗證，以及設定 UI 提示
- 驗證、上手流程與設定中繼資料（別名、自動啟用、提供者環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列擁有權的簡寫
- 靜態能力擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併到目錄與驗證介面的特定通道設定中繼資料

**請勿用於：** 註冊執行階段行為、宣告程式碼進入點，或 npm 安裝中繼資料。這些應放在你的外掛程式碼和 `package.json` 中。

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| 欄位                                 | 必填     | 類型                         | 含義                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 規範外掛 ID。這是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                          |
| `requiresPlugins`                    | 否       | `string[]`                   |此外掛要生效時也必須安裝的外掛 ID。探索會讓此外掛保持可載入，但在缺少任何必要外掛時提出警告。                                                                                              |
| `enabledByDefault`                   | 否       | `true`                       | 將 bundled 外掛標記為預設啟用。省略它，或設定任何非 `true` 值，會讓此外掛保持預設停用。                                                                                                    |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 僅在列出的 Node.js 平台上將 bundled 外掛標記為預設啟用，例如 `["darwin"]`。明確設定仍優先。                                                                                                |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此規範外掛 ID 的舊版 ID。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提到這些提供者 ID 時，應自動啟用此外掛。                                                                                                                                                                                          |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告一個或多個由 `plugins.slots.*` 使用的互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個槽位的外掛會在同一個陣列中宣告兩種種類。                                             |
| `channels`                           | 否       | `string[]`                   | 此外掛擁有的通道 ID。用於探索與設定驗證。                                                                                                                                                                                                               |
| `providers`                          | 否       | `string[]`                   | 此外掛擁有的提供者 ID。                                                                                                                                                                                                                                 |
| `providerCatalogEntry`               | 否       | `string`                     | 輕量提供者目錄模組路徑，相對於外掛根目錄，用於 manifest 範圍的提供者目錄中繼資料，可在不啟用完整外掛執行階段的情況下載入。                                                              |
| `modelSupport`                       | 否       | `object`                     | manifest 擁有的模型家族中繼資料簡寫，用於在執行階段前自動載入外掛。                                                                                                                                                                                    |
| `modelCatalog`                       | 否       | `object`                     | 此外掛擁有的提供者之宣告式模型目錄中繼資料。這是未來唯讀清單、onboarding、模型選擇器、別名與抑制功能的控制平面合約，且不需載入外掛執行階段。                                             |
| `modelPricing`                       | 否       | `object`                     | 提供者擁有的外部定價查詢政策。用它讓本機/自託管提供者退出遠端定價目錄，或將提供者參照對應到 OpenRouter/LiteLLM 目錄 ID，而不在核心中硬編碼提供者 ID。                                      |
| `modelIdNormalization`               | 否       | `object`                     | 提供者擁有的模型 ID 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                                                                     |
| `providerEndpoints`                  | 否       | `object[]`                   | manifest 擁有的端點主機/baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                            |
| `providerRequest`                    | 否       | `object`                     | 泛用請求政策在提供者執行階段載入前使用的廉價提供者家族與請求相容性中繼資料。                                                                                                             |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 提供者預設，讓 setup 或安裝介面可提供這些預設，而不在核心中硬編碼提供者特定整合。                                                                                    |
| `cliBackends`                        | 否       | `string[]`                   | 此外掛擁有的命令列介面推論後端 ID。用於從明確設定參照在啟動時自動啟用。                                                                                                                   |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 提供者或命令列介面後端參照，其外掛擁有的合成驗證 hook 應在執行階段載入前，於 cold 模型探索期間探測。                                                                                      |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | bundled 外掛擁有的佔位 API 金鑰值，代表非秘密的本機、OAuth 或環境憑證狀態。                                                                                                               |
| `commandAliases`                     | 否       | `object[]`                   | 此外掛擁有的命令名稱，應在執行階段載入前產生具外掛感知能力的設定與命令列介面診斷。                                                                                                       |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 已棄用的相容性 env 中繼資料，用於提供者驗證/狀態查詢。新外掛請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此項。                                                     |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 應重用另一個提供者 ID 進行驗證查詢的提供者 ID，例如共享基礎提供者 API 金鑰與驗證設定檔的 coding 提供者。                                                                                   |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 可在不載入外掛程式碼的情況下檢查的廉價通道 env 中繼資料。用於泛用啟動/設定 helper 應看見的 env 驅動通道 setup 或驗證介面。                                                       |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於 onboarding 選擇器、偏好提供者解析與簡單命令列介面旗標接線的廉價驗證選項中繼資料。                                                                                                   |
| `activation`                         | 否       | `object`                     | 用於啟動、提供者、命令、通道、路由與 capability 觸發載入的廉價啟用規劃器中繼資料。僅為中繼資料；實際行為仍由外掛執行階段擁有。                                                           |
| `setup`                              | 否       | `object`                     | 廉價 setup/onboarding 描述子，讓探索與 setup 介面可在不載入外掛執行階段的情況下檢查。                                                                                                     |
| `qaRunners`                          | 否       | `object[]`                   | 共享 `openclaw qa` host 在外掛執行階段載入前使用的廉價 QA runner 描述子。                                                                                                                  |
| `contracts`                          | 否       | `object`                     | 外部驗證 hook、嵌入、語音、即時轉錄、即時語音、媒體理解、圖片/影片/音樂生成、web fetch、web search、文件/web 內容擷取與工具所有權的靜態 capability 所有權快照。                            |
| `configContracts`                    | 否       | `object`                     | manifest 擁有、由泛用核心 helper 消費的設定行為：危險旗標偵測、SecretRef 遷移目標與舊版設定路徑縮窄。請參閱 [configContracts reference](#configcontracts-reference)。                      |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 針對在 `contracts.mediaUnderstandingProviders` 中宣告的提供者 ID 之廉價媒體理解預設值。                                                                                                    |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對在 `contracts.imageGenerationProviders` 中宣告的提供者 ID 之廉價圖片生成驗證中繼資料，包括提供者擁有的驗證別名與 base-url 防護。                                                       |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | 在 `contracts.videoGenerationProviders` 中宣告的供應商 ID 的輕量影片生成驗證中繼資料，包括供應商擁有的驗證別名與 base-url 防護。                                                                                       |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | 在 `contracts.musicGenerationProviders` 中宣告的供應商 ID 的輕量音樂生成驗證中繼資料，包括供應商擁有的驗證別名與 base-url 防護。                                                                                       |
| `toolMetadata`                       | No       | `Record<string, object>`     | 在 `contracts.tools` 中宣告、由外掛擁有的工具可用性輕量中繼資料。當工具不應在缺少設定、環境變數或驗證證據時載入 runtime，請使用它。                                                                                |
| `channelConfigs`                     | No       | `Record<string, object>`     | 由 manifest 擁有的頻道設定中繼資料，會在 runtime 載入前合併到 discovery 與驗證介面。                                                                                                                                               |
| `skills`                             | No       | `string[]`                   | 要載入的 Skill 目錄，相對於外掛根目錄。                                                                                                                                                                                                  |
| `name`                               | No       | `string`                     | 人類可讀的外掛名稱。                                                                                                                                                                                                                              |
| `description`                        | No       | `string`                     | 顯示在外掛介面中的簡短摘要。                                                                                                                                                                                                                  |
| `icon`                               | No       | `string`                     | marketplace/catalog 卡片使用的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL；若省略或無效，則回退為預設外掛圖示。                                                                                       |
| `version`                            | No       | `string`                     | 資訊性外掛版本。                                                                                                                                                                                                                            |
| `uiHints`                            | No       | `Record<string, object>`     | 設定欄位的 UI 標籤、預留文字與敏感性提示。                                                                                                                                                                                        |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位會描述在相符的 `contracts.*GenerationProviders` 清單中宣告之提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具不必匯入每個提供者外掛，就能判斷某個生成提供者是否可用。

這些欄位只應用於低成本、宣告式的事實。傳輸、請求轉換、權杖重新整理、憑證驗證，以及實際生成行為，都留在外掛執行階段中。

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

每個中繼資料項目支援：

| 欄位                   | 必填 | 類型       | 含義                                                                                                                                       |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | 否   | `string[]` | 應被視為該生成提供者靜態驗證別名的其他提供者 ID。                                                                                         |
| `authProviders`        | 否   | `string[]` | 其已設定驗證設定檔應被視為此生成提供者驗證的提供者 ID。                                                                                   |
| `configSignals`        | 否   | `object[]` | 適用於本機或自託管提供者的低成本純設定可用性訊號，這些提供者可不透過驗證設定檔或環境變數進行設定。                                       |
| `authSignals`          | 否   | `object[]` | 明確的驗證訊號。若存在，這些訊號會取代來自提供者 ID、`aliases` 和 `authProviders` 的預設訊號集合。                                        |
| `referenceAudioInputs` | 否   | `boolean`  | 僅限影片生成。當提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。                                           |

每個 `configSignals` 項目支援：

| 欄位             | 必填 | 類型       | 含義                                                                                                                                                                             |
| ---------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是   | `string`   | 要檢查之外掛擁有的設定物件點路徑，例如 `plugins.entries.example.config`。                                                                                                       |
| `overlayPath`    | 否   | `string`   | 根設定內的點路徑，其物件應在評估訊號前覆蓋根物件。可用於特定能力的設定，例如 `image`、`video` 或 `music`。                                                                      |
| `overlayMapPath` | 否   | `string`   | 根設定內的點路徑，其物件值應各自覆蓋根物件。可用於具名帳號對應，例如 `accounts`，其中任何已設定的帳號都應符合資格。                                                            |
| `required`       | 否   | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不得為空；物件和陣列不得為空。                                                                                                         |
| `requiredAny`    | 否   | `string[]` | 有效設定內的點路徑，其中至少一個必須具有已設定值。                                                                                                                             |
| `mode`           | 否   | `object`   | 有效設定內的選用字串模式防護。當純設定可用性只適用於某個模式時使用。                                                                                                           |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                       |
| ------------ | ---- | ---------- | -------------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                        |
| `default`    | 否   | `string`   | 設定省略該路徑時使用的模式值。                                             |
| `allowed`    | 否   | `string[]` | 若存在，只有當有效模式是這些值之一時，訊號才會通過。                       |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式是這些值之一時，訊號會失敗。                             |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                                                 |
| ----------------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                             |
| `providerBaseUrl` | 否   | `object` | 選用防護，只有當被參照的已設定提供者使用允許的基底 URL 時，才會計入該訊號。當驗證別名只對特定 API 有效時使用。                                                     |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                         |
| ----------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的提供者設定 ID。                                                                                                       |
| `defaultBaseUrl`  | 否   | `string`   | 提供者設定省略 `baseUrl` 時假設使用的基底 URL。                                                                                              |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設的基底 URL 不符合這些正規化值之一時，會忽略該訊號。                                                  |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 形狀，並以工具名稱作為鍵。`contracts.tools` 宣告所有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 不必為了讓工具工廠傳回 `null` 而匯入外掛執行階段。

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

除了上方共用的 `configSignals`/`authSignals` 欄位之外，`toolMetadata` 項目也接受 `optional`（將工具標記為外掛啟用時非必需）和 `replaySafe`（將工具執行標記為可在不完整的模型回合後安全重複）。

如果某個工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於其工廠依賴驗證/設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個上線導引或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此資訊。提供者設定清單會使用這些資訊清單選項、由描述元衍生的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填     | 類型                                                                  | 含義                                                                                                      |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                                              | 此選項所屬的提供者 ID。                                                                                  |
| `method`              | 是       | `string`                                                              | 要分派到的驗證方法 ID。                                                                                  |
| `choiceId`            | 是       | `string`                                                              | 由上線導引與命令列介面流程使用的穩定驗證選項 ID。                                                        |
| `choiceLabel`         | 否       | `string`                                                              | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                                |
| `choiceHint`          | 否       | `string`                                                              | 選擇器的簡短輔助文字。                                                                                   |
| `assistantPriority`   | 否       | `number`                                                              | 在助理驅動的互動式選擇器中，較低的值會排序在前。                                                        |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                                        | 從助理選擇器隱藏此選項，同時仍允許手動命令列介面選取。                                                    |
| `deprecatedChoiceIds` | 否       | `string[]`                                                            | 應將使用者重新導向至此替代選項的舊版選項 ID。                                                            |
| `groupId`             | 否       | `string`                                                              | 用於將相關選項分組的選用群組 ID。                                                                        |
| `groupLabel`          | 否       | `string`                                                              | 該群組面向使用者的標籤。                                                                                 |
| `groupHint`           | 否       | `string`                                                              | 群組的簡短輔助文字。                                                                                     |
| `onboardingFeatured`  | 否       | `boolean`                                                             | 在互動式上線導引選擇器的精選層級中顯示此群組，位於「更多...」項目之前。                                  |
| `optionKey`           | 否       | `string`                                                              | 簡單單一旗標驗證流程的內部選項鍵。                                                                       |
| `cliFlag`             | 否       | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                        |
| `cliOption`           | 否       | `string`                                                              | 完整命令列介面選項形狀，例如 `--openrouter-api-key <key>`。                                              |
| `cliDescription`      | 否       | `string`                                                              | 命令列介面說明中使用的描述。                                                                             |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些上線導引介面中。若省略，預設為 `["text-inference"]`。                                  |

## commandAliases 參考

當外掛擁有一個執行階段命令名稱，而使用者可能會錯誤地把它放入 `plugins.allow`，或嘗試把它作為根命令列介面命令執行時，請使用 `commandAliases`。OpenClaw 會使用此中繼資料進行診斷，而不匯入外掛執行階段程式碼。

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
| `name`       | 是       | `string`          | 屬於此外掛的命令名稱。                                                  |
| `kind`       | 否       | `"runtime-slash"` | 將別名標記為聊天斜線命令，而非根命令列介面命令。                        |
| `cliCommand` | 否       | `string`          | 若存在，建議用於命令列介面操作的相關根命令列介面命令。                  |

## activation 參考

當外掛可以低成本宣告哪些控制平面事件應在啟用/載入計畫中包含它時，請使用 `activation`。

此區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不承諾外掛程式碼已經執行。啟用規劃器會使用這些欄位先縮小候選外掛範圍，再退回到既有的資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與 hooks。

優先使用已能描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、setup 描述子或 `contracts` 能表達關係時，請使用那些欄位。將 `activation` 用於無法由那些擁有權欄位表示的額外規劃器提示。對於 `claude-cli`、`my-cli` 或 `google-gemini-cli` 這類命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅用於尚無擁有權欄位的嵌入式代理 harness ID。

每個外掛都應有意設定 `activation.onStartup`。只有當外掛必須在閘道啟動期間執行時，才將它設為 `true`。當外掛在啟動時是惰性的，且應只由較窄的觸發條件載入時，請將它設為 `false`。省略 `onStartup` 不再會隱含地於啟動時載入外掛；請針對啟動、通道、設定、代理 harness、記憶體或其他較窄的啟用觸發條件使用明確的啟用中繼資料。

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

| 欄位               | 必填     | 類型                                                 | 含義                                                                                                                                                                                |
| ------------------ | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否       | `boolean`                                            | 明確的閘道啟動啟用。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 會讓它在啟動時保持延遲載入，除非另一個相符觸發條件需要載入。 |
| `onProviders`      | 否       | `string[]`                                           | 應在啟用/載入計畫中包含此外掛的提供者 ID。                                                                                                                                        |
| `onAgentHarnesses` | 否       | `string[]`                                           | 應在啟用/載入計畫中包含此外掛的嵌入式代理 harness 執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                                                      |
| `onCommands`       | 否       | `string[]`                                           | 應在啟用/載入計畫中包含此外掛的命令 ID。                                                                                                                                          |
| `onChannels`       | 否       | `string[]`                                           | 應在啟用/載入計畫中包含此外掛的通道 ID。                                                                                                                                          |
| `onRoutes`         | 否       | `string[]`                                           | 應在啟用/載入計畫中包含此外掛的路由種類。                                                                                                                                         |
| `onConfigPaths`    | 否       | `string[]`                                           | 當路徑存在且未被明確停用時，應在啟動/載入計畫中包含此外掛的根相對設定路徑。                                                                                                      |
| `onCapabilities`   | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣義能力提示。可行時優先使用較窄的欄位。                                                                                                                   |

目前的即時消費者：

- 閘道啟動規劃使用 `activation.onStartup` 進行明確的啟動匯入。
- 由命令觸發的命令列介面規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理執行階段啟動規劃會對嵌入式 harness 使用 `activation.onAgentHarnesses`，並對命令列介面執行階段別名使用頂層 `cliBackends[]`。
- 由通道觸發的 setup/通道規劃會在缺少明確通道啟用中繼資料時，退回使用舊版 `channels[]` 擁有權。
- 啟動外掛規劃會對非通道根設定介面使用 `activation.onConfigPaths`，例如 bundled 瀏覽器外掛的 `browser` 區塊。
- 由提供者觸發的 setup/執行階段規劃會在缺少明確提供者啟用中繼資料時，退回使用舊版 `providers[]` 與頂層 `cliBackends[]` 擁有權。

規劃器診斷可以區分明確啟用提示與資訊清單擁有權退回。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤用於主機診斷與測試；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當外掛在共用的 `openclaw qa` 根之下貢獻一個或多個傳輸 runner 時，請使用 `qaRunners`。保持此中繼資料低成本且靜態；外掛執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際的命令列介面註冊，該介面會匯出 `qaRunnerCliRegistrations`。

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

| 欄位          | 必填     | 類型     | 含義                                                                 |
| ------------- | -------- | -------- | -------------------------------------------------------------------- |
| `commandName` | 是       | `string` | 掛載於 `openclaw qa` 之下的子命令，例如 `matrix`。                   |
| `description` | 否       | `string` | 當共用主機需要 stub 命令時使用的退回說明文字。                       |

## setup 參考

當 setup 與上線導引介面需要在執行階段載入前取得低成本、外掛擁有的中繼資料時，請使用 `setup`。

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
            "source": "openai 本機憑證"
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

頂層 `cliBackends` 維持有效，並繼續描述命令列介面推論後端。`setup.cliBackends` 是控制平面/設定流程專用的描述器介面，應維持僅中繼資料。

當存在時，`setup.providers` 和 `setup.cliBackends` 是設定探索偏好的描述器優先查找介面。如果描述器只縮小候選外掛範圍，而設定仍需要更豐富的設定時期執行階段鉤子，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 也會在通用提供者驗證和環境變數查找中納入 `setup.providers[].envVars`。`providerAuthEnvVars` 在棄用窗口期間仍透過相容性配接器支援，但仍使用它的非內建外掛會收到 manifest 診斷。新的外掛應將設定/狀態環境中繼資料放在 `setup.providers[].envVars`。

當沒有可用的設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的設定選項。明確的 `providerAuthChoices` 項目仍優先用於自訂標籤、命令列介面旗標、導入範圍和助理中繼資料。

只有當這些描述器足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述器合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 來進行設定查找。如果僅描述器外掛仍出貨其中一個設定執行階段項目，OpenClaw 會回報增量診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版備援行為，因此既有外掛若新增描述器但未加上該旗標，不會因此中斷。

由於設定查找可能會執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必須在已探索的外掛之間保持唯一。模稜兩可的擁有權會封閉失敗，而不是從探索順序中挑選勝者。

當設定執行階段確實執行時，如果 `setup-api` 註冊了 manifest 描述器未宣告的提供者或命令列介面後端，或描述器沒有相符的執行階段註冊，設定登錄診斷會回報描述器漂移。這些診斷是增量的，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位 | 必填 | 類型 | 意義 |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 設定或導入期間公開的提供者 id。保持正規化 id 全域唯一。 |
| `authMethods` | 否 | `string[]` | 此提供者在不載入完整執行階段的情況下支援的設定/驗證方法 id。 |
| `envVars` | 否 | `string[]` | 通用設定/狀態介面可在外掛執行階段載入前檢查的環境變數。 |
| `authEvidence` | 否 | `object[]` | 針對可透過非祕密標記驗證的提供者，進行廉價的本機驗證證據檢查。 |

`authEvidence` 用於提供者擁有的本機憑證標記，可在不載入執行階段程式碼的情況下驗證。這些檢查必須保持廉價且本機：不進行網路呼叫、不讀取鑰匙圈或祕密管理器、不執行 shell 命令，也不探測提供者 API。

支援的證據項目：

| 欄位 | 必填 | 類型 | 意義 |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type` | 是 | `string` | 目前為 `local-file-with-env`。 |
| `fileEnvVar` | 否 | `string` | 包含明確憑證檔案路徑的環境變數。 |
| `fallbackPaths` | 否 | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。 |
| `requiresAnyEnv` | 否 | `string[]` | 列出的環境變數至少必須有一個非空，證據才有效。 |
| `requiresAllEnv` | 否 | `string[]` | 列出的每個環境變數都必須非空，證據才有效。 |
| `credentialMarker` | 是 | `string` | 證據存在時傳回的非祕密標記。 |
| `source` | 否 | `string` | 驗證/狀態輸出的面向使用者來源標籤。 |

### setup 欄位

| 欄位 | 必填 | 類型 | 意義 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 設定和導入期間公開的提供者設定描述器。 |
| `cliBackends` | 否 | `string[]` | 用於描述器優先設定查找的設定時期後端 id。保持正規化 id 全域唯一。 |
| `configMigrations` | 否 | `string[]` | 此外掛設定介面擁有的設定遷移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述器查找後，設定是否仍需要執行 `setup-api`。 |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型呈現提示的映射。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 金鑰",
      "help": "用於 OpenRouter 請求",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每個欄位提示可以包含：

| 欄位 | 類型 | 意義 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向使用者的欄位標籤。 |
| `help` | `string` | 簡短輔助文字。 |
| `tags` | `string[]` | 選用 UI 標籤。 |
| `advanced` | `boolean` | 將欄位標記為進階。 |
| `sensitive` | `boolean` | 將欄位標記為祕密或敏感。 |
| `placeholder` | `string` | 表單輸入的預留位置文字。 |

## contracts 參考

僅將 `contracts` 用於 OpenClaw 可在不匯入外掛執行階段的情況下讀取的靜態功能擁有權中繼資料。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每個清單都是選用的：

| 欄位                             | 類型       | 意義                                                                                                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 擴充工廠識別碼，目前為 `codex-app-server`。                                                                                |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果中介軟體的執行階段識別碼。                                                                                         |
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任工具前置政策識別碼。隨附外掛可在沒有此欄位的情況下註冊政策。                                               |
| `externalAuthProviders`          | `string[]` |此外掛擁有其外部驗證設定檔鉤子的提供者識別碼。                                                                                              |
| `embeddingProviders`             | `string[]` | 此外掛擁有的通用嵌入提供者識別碼，用於可重複使用的向量嵌入用途，包括記憶體。                                                               |
| `speechProviders`                | `string[]` | 此外掛擁有的語音提供者識別碼。                                                                                                             |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄提供者識別碼。                                                                                                         |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音提供者識別碼。                                                                                                         |
| `memoryEmbeddingProviders`       | `string[]` | 已棄用的記憶體專用嵌入提供者識別碼，由此外掛擁有。                                                                                         |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解提供者識別碼。                                                                                                         |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源提供者識別碼。                                                                                                       |
| `documentExtractors`             | `string[]` | 此外掛擁有的文件（例如 PDF）擷取器提供者識別碼。                                                                                           |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的圖片生成提供者識別碼。                                                                                                         |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成提供者識別碼。                                                                                                         |
| `musicGenerationProviders`       | `string[]` | 此外掛擁有的音樂生成提供者識別碼。                                                                                                         |
| `webContentExtractors`           | `string[]` | 此外掛擁有的網頁內容擷取提供者識別碼。                                                                                                     |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取提供者識別碼。                                                                                                         |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋提供者識別碼。                                                                                                         |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 擁有的匯入提供者識別碼。                                                                                       |
| `gatewayMethodDispatch`          | `string[]` | 已驗證外掛 HTTP 路由的保留權限，用於在處理程序內分派閘道方法。                                                                             |
| `tools`                          | `string[]` | 此外掛擁有的代理程式工具名稱。                                                                                                             |

`contracts.embeddedExtensionFactories` 保留給僅限隨附 Codex app-server 的擴充工廠。隨附的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。已安裝外掛只有在明確啟用，且僅針對其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段時，才可使用相同的中介軟體接縫。

需要主機受信任工具前置政策層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機識別碼，並且必須明確啟用。隨附外掛保留既有的受信任政策路徑，但具有未宣告政策識別碼的已安裝外掛會在註冊前遭到拒絕。政策識別碼的範圍限於註冊它的外掛，因此兩個外掛可以同時宣告並註冊 `workflow-budget`；單一外掛不得重複註冊相同的本機識別碼。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，只載入可擁有所要求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的提供者外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證鉤子會被忽略。

通用嵌入提供者應針對每個透過 `api.registerEmbeddingProvider(...)` 註冊的配接器宣告 `contracts.embeddingProviders`。請將通用合約用於可重複使用的向量生成，包括由記憶體搜尋消耗的提供者。`contracts.memoryEmbeddingProviders` 是已棄用的記憶體專用相容性項目，只會在既有提供者遷移到通用嵌入提供者接縫期間保留。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。這是針對原生外掛 HTTP 路由的 API 衛生閘門，這些路由會刻意在處理程序內分派閘道控制平面方法；它不是防範惡意原生外掛的沙箱。只應將其用於已嚴格審查、且已要求閘道 HTTP 驗證的隨附/操作員介面。

## configContracts 參考

使用 `configContracts` 供通用核心輔助程式取得清單擁有的設定行為，而不需匯入外掛執行階段：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑縮窄。

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| 欄位                          | 必填 | 類型       | 意義                                                                                                                                                                                                 |
| ----------------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否   | `string[]` | 以根為相對基準的設定路徑，表示此外掛的設定期間相容性遷移可能適用。當設定從未參照此外掛時，讓通用執行階段設定讀取可略過每個外掛設定介面。                                                           |
| `compatibilityRuntimePaths`   | 否   | `string[]` | 以根為相對基準的相容性路徑，此外掛可在外掛程式碼完全啟動前於執行階段服務這些路徑。將其用於舊版介面，以便縮窄隨附候選集，而不需匯入每個相容外掛執行階段。                                           |
| `dangerousFlags`              | 否   | `object[]` | `openclaw doctor` 應在啟用時標記為不安全或危險的設定常值。見下方。                                                                                                                                 |
| `secretInputs`                | 否   | `object`   | `plugins.entries.<id>.config` 下的設定路徑，SecretRef 遷移/稽核目標登錄應將其視為祕密形狀的字串。見下方。                                                                                          |

每個 `dangerousFlags` 項目支援：

| 欄位     | 必填 | 類型                                  | 意義                                                                                                    |
| -------- | ---- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `path`   | 是   | `string`                              | 相對於 `plugins.entries.<id>.config` 的點分隔設定路徑。支援用於映射/陣列區段的 `*` 萬用字元。          |
| `equals` | 是   | `string \| number \| boolean \| null` | 將此設定值標記為危險的精確常值。                                                                       |

`secretInputs` 支援：

| 欄位                    | 必填 | 類型       | 意義                                                                                                                                                                                                 |
| ----------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否   | `boolean`  | 在判斷此 SecretRef 介面是否為作用中時，覆寫隨附外掛預設啟用狀態。當外掛已隨附，但該介面應保持非作用中直到在設定中明確啟用時，請使用此欄位。                                                        |
| `paths`                 | 是   | `object[]` | 祕密形狀的設定路徑，每個項目含有 `path`（點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元）以及選用的 `expected`（目前僅支援 `"string"`）。                                          |

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證後援優先順序，或通用核心輔助程式在執行階段載入前需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

每個提供者項目可包含：

| 欄位                   | 類型                                                             | 意義                                                                                                            |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此 provider 暴露的媒體能力。                                                                                   |
| `defaultModels`        | `Record<string, string>`                                         | 設定未指定模型時使用的能力到模型預設值。                                                                       |
| `autoPriority`         | `Record<string, number>`                                         | 數字越小，在自動憑證式 provider 備援排序中越靠前。                                                            |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | provider 支援的原生文件輸入。                                                                                  |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 依文件類型指定的模型覆寫。設定 `image: false` 可停用該文件類型的影像式擷取。 |

## channelConfigs 參考

當 channel 外掛需要在 runtime 載入前取得輕量設定中繼資料時，請使用 `channelConfigs`。唯讀的 channel 設定/狀態探索可在沒有設定項目可用時，或 `setup.requiresRuntime: false` 宣告設定不需要 runtime 時，直接針對已設定的外部 channel 使用此中繼資料。

`channelConfigs` 是外掛 manifest 中繼資料，不是新的頂層使用者設定區段。使用者仍然在 `channels.<channel-id>` 下設定 channel 實例。OpenClaw 會讀取 manifest 中繼資料，以便在外掛 runtime 程式碼執行前判定哪個外掛擁有該已設定的 channel。

對於 channel 外掛，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非 bundled 外掛也應宣告相符的 `channelConfigs` 項目。若未宣告，OpenClaw 仍可載入外掛，但冷路徑設定 schema、設定流程和 Control UI 介面必須等到外掛 runtime 執行後，才會知道 channel 擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可宣告靜態 `auto` 預設值，用於 channel runtime 載入前執行的命令設定檢查。Bundled channels 也可以透過 `package.json#openclaw.channel.commands` 發布相同預設值，並與其他 package 擁有的 channel catalog 中繼資料並列。

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

每個 channel 項目可包含：

| 欄位          | 類型                     | 意義                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的 channel 設定項目都必須提供。            |
| `uiHints`     | `Record<string, object>` | 該 channel 設定區段的選用 UI 標籤/placeholder/敏感資訊提示。                         |
| `label`       | `string`                 | runtime 中繼資料尚未就緒時，合併到 picker 和 inspect 介面的 channel 標籤。           |
| `description` | `string`                 | 用於 inspect 和 catalog 介面的簡短 channel 描述。                                    |
| `commands`    | `object`                 | runtime 前設定檢查使用的靜態原生命令和原生 skill 自動預設值。                        |
| `preferOver`  | `string[]`               | 此 channel 在選取介面中應優先於的舊版或較低優先度外掛 id。                           |

### 取代另一個 channel 外掛

當你的外掛是某個 channel id 的偏好擁有者，而另一個外掛也能提供該 channel id 時，請使用 `preferOver`。常見情況包括外掛 id 重新命名、獨立外掛取代 bundled 外掛，或維護中的 fork 為了設定相容性而保留相同的 channel id。

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

當 `channels.chat` 已設定時，OpenClaw 會同時考量 channel id 和偏好的外掛 id。如果較低優先度的外掛只是因為它是 bundled 或預設啟用而被選取，OpenClaw 會在有效 runtime 設定中停用它，讓單一外掛擁有該 channel 及其工具。明確的使用者選擇仍然優先：如果使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇，並回報重複 channel/tool 診斷，而不是悄悄變更要求的外掛集合。

請將 `preferOver` 限定於確實能提供相同 channel 的外掛 id。它不是一般優先度欄位，也不會重新命名使用者設定 key。

## modelSupport 參考

當 OpenClaw 應在外掛 runtime 載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6` 這類簡寫模型 id 推斷你的 provider 外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用此優先順序：

- 明確的 `provider/model` 參照會使用擁有者的 `providers` manifest 中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非 bundled 外掛和一個 bundled 外掛都相符，非 bundled 外掛優先
- 剩餘的歧義會被忽略，直到使用者或設定指定 provider

欄位：

| 欄位            | 類型       | 意義                                                                    |
| --------------- | ---------- | ----------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 對簡寫模型 id 進行比對的前綴。                       |
| `modelPatterns` | `string[]` | 移除 profile 後綴後，對簡寫模型 id 進行比對的 regex 來源。             |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯；它會拒絕包含巢狀重複的 pattern（例如 `(a+)+$`）。未通過安全檢查的 pattern 會被靜默略過，與語法無效的 regex 相同。請保持 pattern 簡單，並避免巢狀量詞。

## modelCatalog 參考

當 OpenClaw 應在載入外掛 runtime 前知道 provider 模型中繼資料時，請使用 `modelCatalog`。這是 manifest 擁有的來源，用於固定 catalog 列、provider alias、抑制規則與 discovery 模式。Runtime refresh 仍屬於 provider runtime 程式碼，但 manifest 會告訴 core 何時需要 runtime。

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

| 欄位             | 類型                                                     | 意義                                                                                                        |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此外掛擁有的 provider id 的 catalog 列。key 也應出現在頂層 `providers` 中。                                 |
| `aliases`        | `Record<string, object>`                                 | 應解析為所擁有 provider 的 provider alias，用於 catalog 或 suppression 規劃。                               |
| `suppressions`   | `object[]`                                               | 此外掛基於 provider 特定原因而抑制的、來自其他來源的模型列。                                                |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | provider catalog 是否可從 manifest 中繼資料讀取、refresh 到快取中，或需要 runtime。                         |
| `runtimeAugment` | `boolean`                                                | 只有當 provider runtime 必須在 manifest/config 規劃後追加 catalog 列時，才設定為 `true`。                   |

`aliases` 會參與模型 catalog 規劃的 provider 擁有權查詢。Alias 目標必須是同一外掛擁有的頂層 provider。當依 provider 篩選的清單使用 alias 時，OpenClaw 可讀取擁有者 manifest，並套用 alias API/base URL 覆寫，而不載入 provider runtime。Alias 不會展開未篩選的 catalog 清單；廣泛清單只會發出擁有者的 canonical provider 列。

`suppressions` 會取代舊的 provider runtime `suppressBuiltInModel` hook。只有當 provider 由外掛擁有，或宣告為指向所擁有 provider 的 `modelCatalog.aliases` key 時，suppression 項目才會生效。模型解析期間不再呼叫 runtime suppression hook。

Provider 欄位：

| 欄位      | 類型                     | 意義                                                           |
| --------- | ------------------------ | -------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此 provider catalog 中模型的選用預設 base URL。                |
| `api`     | `ModelApi`               | 此 provider catalog 中模型的選用預設 API adapter。             |
| `headers` | `Record<string, string>` | 套用至此 provider catalog 的選用靜態 headers。                 |
| `models`  | `object[]`               | 必要的模型列。沒有 `id` 的列會被忽略。                         |

模型欄位：

| 欄位               | 型別                                                           | 意義                                                                        |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供者本地模型 ID，不含 `provider/` 前綴。                                  |
| `name`             | `string`                                                       | 選用的顯示名稱。                                                            |
| `api`              | `ModelApi`                                                     | 選用的逐模型 API 覆寫。                                                     |
| `baseUrl`          | `string`                                                       | 選用的逐模型基底 URL 覆寫。                                                 |
| `headers`          | `Record<string, string>`                                       | 選用的逐模型靜態標頭。                                                      |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被靜默丟棄。                                        |
| `reasoning`        | `boolean`                                                      | 模型是否公開推理行為。                                                      |
| `contextWindow`    | `number`                                                       | 原生提供者上下文視窗。                                                      |
| `contextTokens`    | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段上下文上限。                 |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出權杖數。                                                    |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的逐思考層級模型 ID 或參數覆寫。                                        |
| `cost`             | `object`                                                       | 選用的每百萬權杖美元價格，包含選用的 `tieredPricing`。                      |
| `compat`           | `object`                                                       | 選用的相容性旗標，對應 OpenClaw 模型設定相容性。                            |
| `mediaInput`       | `object`                                                       | 選用的逐模態輸入設定，目前僅限圖片。                                        |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有在該列完全不應出現時才抑制。                                  |
| `statusReason`     | `string`                                                       | 非可用狀態時顯示的選用原因。                                                |
| `replaces`         | `string[]`                                                     | 此模型取代的較舊提供者本地模型 ID。                                         |
| `replacedBy`       | `string`                                                       | 已棄用列的替代提供者本地模型 ID。                                           |
| `tags`             | `string[]`                                                     | 選擇器和篩選器使用的穩定標籤。                                              |

抑制欄位：

| 欄位                       | 型別       | 意義                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此外掛擁有，或宣告為擁有的別名。                                          |
| `model`                    | `string`   | 要抑制的提供者本地模型 ID。                                                                               |
| `reason`                   | `string`   | 直接請求被抑制列時顯示的選用訊息。                                                                        |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的有效提供者基底 URL 主機選用清單。                                                         |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確提供者設定 `api` 值選用清單。                                                         |

不要把僅供執行階段使用的資料放進 `modelCatalog`。只有在資訊清單列完整到足以讓經提供者篩選的清單和選擇器介面略過登錄/執行階段探索時，才使用 `static`。當資訊清單列是有用的可列出種子或補充資料，但重新整理/快取稍後可以加入更多列時，使用 `refreshable`；refreshable 列本身不是權威來源。當 OpenClaw 必須載入提供者執行階段才能得知清單時，使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、由提供者擁有且必須在提供者執行階段載入前完成的模型 ID 清理。這會把短模型名稱、提供者本地舊版 ID、代理前綴規則等別名留在擁有它們的外掛資訊清單中，而不是放進核心模型選擇表。

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

| 欄位                                 | 型別                    | 意義                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依原樣傳回。                                          |
| `stripPrefixes`                      | `string[]`              | 別名查找前要移除的前綴，適合舊版 provider/model 重複情況。                                |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。                      |

## providerEndpoints 參考

使用 `providerEndpoints` 提供一般請求政策在提供者執行階段載入前必須知道的端點分類。核心仍擁有每個 `endpointClass` 的意義；外掛資訊清單擁有主機和基底 URL 中繼資料。

正式外部化的提供者外掛會從核心 dist 中排除，因此
其資訊清單在安裝前不可見。它們的 `providerEndpoints` 也必須
鏡像到 `scripts/lib/official-external-provider-catalog.json`，如此一來
即使沒有外掛，端點分類仍能運作；合約測試會強制執行此鏡像。

端點欄位：

| 欄位                           | 型別       | 意義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                    |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                                 |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機後綴。使用 `.` 前綴可僅比對網域後綴。                                     |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) 基底 URL。                                                  |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的後綴，用於公開 Google Vertex 區域前綴。                                       |

## providerRequest 參考

使用 `providerRequest` 提供一般請求政策在不載入提供者執行階段時所需的低成本請求相容性中繼資料。將行為特定的酬載重寫保留在提供者執行階段掛鉤或共享提供者家族輔助程式中。

```json
{
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

| 欄位                  | 型別         | 意義                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 一般請求相容性決策和診斷使用的提供者家族標籤。                                         |
| `compatibilityFamily` | `"moonshot"` | 共享請求輔助程式的選用提供者家族相容性分組。                                           |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。                    |

## secretProviderIntegrations 參考

當外掛可以發布可重用的 SecretRef exec 提供者預設時，使用 `secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料，將外掛所有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際秘密解析留給 SecretRef 執行階段。預設只會公開給內建外掛，以及從受管理外掛安裝根目錄探索到的已安裝外掛，例如 git 和 ClawHub 安裝。

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

映射鍵是整合 ID。如果省略 `providerAlias`，OpenClaw 會使用整合 ID 作為 SecretRef 提供者別名。提供者別名必須符合一般 SecretRef 提供者別名模式，例如 `team-secrets` 或 `onepassword-work`。

當操作員選取預設時，OpenClaw 會寫入如下的提供者參照：

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

啟動/重新載入時，OpenClaw 會透過載入目前外掛資訊清單中繼資料、檢查擁有的外掛已安裝且作用中，並從資訊清單具體化 exec 命令來解析該提供者。停用或移除外掛會撤銷作用中 SecretRefs 的提供者。想要獨立 exec 設定的操作員仍可直接手動撰寫 `command`/`args` 提供者。

目前只支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]` 必須是 `./` 外掛根目錄相對的解析器指令碼。OpenClaw 會在啟動/重新載入時，將它具體化為目前的 Node 可執行檔和外掛內指令碼的絕對路徑。Node 選項，例如 `--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print`，不屬於資訊清單預設合約的一部分。需要非 Node 命令的操作員可以直接設定獨立的手動 exec 提供者。

OpenClaw 會從外掛根目錄推導資訊清單預設的 `trustedDirs`，而對於 `${node}` 預設，則會從目前的節點可執行檔目錄推導。資訊清單作者撰寫的 `trustedDirs` 會被忽略。其他 exec 提供者選項，例如 `timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath`，會傳遞到一般的 SecretRef exec 提供者設定。

## modelPricing 參考

當提供者需要在執行階段載入前控制控制平面定價行為時，請使用 `modelPricing`。閘道定價快取會讀取這些中繼資料，而不匯入提供者執行階段程式碼。

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

| 欄位         | 類型              | 含義                                                                                               |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對於絕不應擷取 OpenRouter 或 LiteLLM 定價的本機/自託管提供者，設定為 `false`。                    |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此提供者的 OpenRouter 查詢。                                |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此提供者的 LiteLLM 查詢。                                      |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 ID 與 OpenClaw 提供者 ID 不同時使用，例如 `zai` 提供者的 `z-ai`。                      |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀提供者/模型參照，適用於 OpenRouter 等代理提供者。                         |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試像 `claude-opus-4.6` 這樣的點分版本 ID。             |

### OpenClaw 提供者索引

OpenClaw 提供者索引是 OpenClaw 所擁有的預覽中繼資料，用於外掛可能尚未安裝的提供者。它不是外掛資訊清單的一部分。外掛資訊清單仍是已安裝外掛的權威來源。當提供者外掛尚未安裝時，提供者索引是未來可安裝提供者和預安裝模型選擇器介面將會使用的內部備援契約。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛資訊清單的 `modelCatalog`。
3. 來自明確重新整理的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

提供者索引不得包含密鑰、啟用狀態、執行階段掛鉤，或即時帳號專屬模型資料。其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 提供者列形狀，但應僅限於穩定的顯示中繼資料，除非刻意讓 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位與已安裝外掛資訊清單保持一致。具有即時 `/models` 探索的提供者，應透過明確的模型目錄快取路徑寫入重新整理後的列，而不是讓一般列出或入門流程呼叫提供者 API。

對於外掛已移出核心或尚未安裝的提供者，提供者索引項目也可以攜帶可安裝外掛中繼資料。此中繼資料仿照頻道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及輕量驗證選擇標籤，足以顯示可安裝的設定選項。一旦外掛安裝完成，其資訊清單即優先，此提供者的提供者索引項目會被忽略。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層資訊清單功能鍵遷移到 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些鍵（或任何其他功能清單）不再被讀取為頂層資訊清單欄位；一般資訊清單載入只會在 `contracts` 底下辨識它們。

## 資訊清單與 package.json

這兩個檔案用途不同：

| 檔案                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選擇中繼資料，以及必須在外掛程式碼執行前存在的介面提示                         |
| `package.json`         | npm 中繼資料、相依性安裝，以及用於進入點、安裝門檻、設定或目錄中繼資料的 `openclaw` 區塊 |

如果不確定某項中繼資料應放在哪裡，請使用這條規則：

- 如果 OpenClaw 必須在載入外掛程式碼之前知道它，請放在 `openclaw.plugin.json`
- 如果它與打包、入口檔案或 npm 安裝行為有關，請放在 `package.json`

### 會影響探索的 package.json 欄位

有些執行階段前的外掛中繼資料會刻意放在 `package.json` 的 `openclaw` 區塊下，而不是 `openclaw.plugin.json`。`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw 外掛契約；原生外掛必須使用 `openclaw.plugin.json` 加上以下支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 含義                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須保留在外掛套件目錄內。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須保留在外掛套件目錄內。                                                                 |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定進入點，用於入門、延後頻道啟動，以及唯讀頻道狀態/SecretRef 探索。必須保留在外掛套件目錄內。 |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的建置後 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須保留在外掛套件目錄內。                         |
| `openclaw.channel`                                                                         | 輕量頻道目錄中繼資料，例如標籤、文件路徑、別名和選擇文案。                                                                                                 |
| `openclaw.channel.commands`                                                                | 靜態原生命令和原生技能自動預設中繼資料，供設定、稽核和命令清單介面在頻道執行階段載入前使用。                                          |
| `openclaw.channel.configuredState`                                                         | 輕量已設定狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已存在僅環境變數設定？」。                                         |
| `openclaw.channel.persistedAuthState`                                                      | 輕量持久化驗證檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已有任何登入狀態？」。                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 給內建和外部發布外掛的安裝/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 當有多個安裝來源可用時的偏好安裝路徑。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用如 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                             |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用如 `>=2026.5.27` 的 semver 下限。                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝和更新流程會用它驗證擷取到的成品。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 當設定無效時，允許狹窄的內建外掛重新安裝復原路徑。                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | 當鎖定檔平台限制符合目前主機時，必須實體化的 npm 套件別名。                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 讓設定執行階段頻道介面在監聽前載入，然後將完整已設定頻道外掛延後到監聽後啟用。                                                 |

資訊清單中繼資料會決定哪些提供者/頻道/設定選擇在執行階段載入前出現在入門流程中。`package.json#openclaw.install` 會告訴入門流程，當使用者選擇其中一個選項時如何擷取或啟用該外掛。不要將安裝提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在非內建外掛來源的安裝和資訊清單登錄載入期間強制執行。無效值會被拒絕；較新但有效的值會讓外部外掛在較舊主機上被略過。內建來源外掛會假設與主機 checkout 共同版本化。

`openclaw.install.requiredPlatformPackages` 適用於透過選用、平台專屬別名公開必要原生二進位檔的 npm 套件。請為每個受支援的平台別名列出裸 npm 套件名稱。在 npm 安裝期間，OpenClaw 只會驗證鎖定檔限制符合目前主機的已宣告別名。如果 npm 回報成功但省略該別名，OpenClaw 會使用全新快取重試一次；若該別名仍缺失，則回復此次安裝。

`openclaw.compat.pluginApi` 會在非內建外掛來源的套件安裝期間強制執行。請用它表示該套件建置時所依據的 OpenClaw 外掛 SDK/runtime API 最低版本。當外掛套件需要較新的 API，但仍想為其他流程保留較低的安裝提示時，它可以比 `minHostVersion` 更嚴格。官方 OpenClaw 發行同步預設會將現有官方外掛 API 最低版本提升到 OpenClaw 發行版本，但當套件有意支援較舊主機時，僅外掛發行可以保留較低的最低版本。不要只用套件版本作為相容性合約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 會使用 `openclaw.compat.pluginApi` 合約來做安裝相容性決策。

官方隨需安裝中繼資料在外掛發佈於 ClawHub 時，應使用 `clawhubSpec`；初始設定會將它視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品事實。`npmSpec` 仍是尚未移轉到 ClawHub 的套件相容性備援。

精確的 npm 版本釘選已存在於 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確規格與 `expectedIntegrity` 搭配使用，讓更新流程在擷取到的 npm 成品不再符合釘選發行版本時以關閉失敗處理。互動式初始設定為了相容性，仍會提供受信任登錄的 npm 規格，包括裸套件名稱與 dist-tags。目錄診斷可以區分精確、浮動、已釘選完整性、缺少完整性、套件名稱不符，以及無效的預設選擇來源。當 `expectedIntegrity` 存在但沒有可供它釘選的有效 npm 來源時，也會提出警告。當 `expectedIntegrity` 存在時，安裝/更新流程會強制執行；當它省略時，登錄解析會在沒有完整性釘選的情況下被記錄。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整 runtime 的情況下識別已設定帳號時，頻道外掛應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及可安全用於設定流程的設定、狀態與 secrets 配接器；網路用戶端、閘道監聽器與傳輸 runtime 應保留在主要擴充進入點中。

Runtime 進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 不能讓逸出邊界的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 刻意保持狹窄。它不會讓任意損壞的設定變得可安裝。目前它只允許安裝流程從特定的過期內建外掛升級失敗中復原，例如缺少內建外掛路徑，或該同一個內建外掛的過期 `channels.<id>` 項目。不相關的設定錯誤仍會阻止安裝，並將操作者導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是用於小型檢查器模組的套件中繼資料：

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

當設定、Doctor、狀態或唯讀存在性流程需要在完整頻道外掛載入前，進行便宜的是/否驗證探測時使用它。持久化驗證狀態不是已設定的頻道狀態：不要用這項中繼資料自動啟用外掛、修復 runtime 依賴，或決定是否應載入頻道 runtime。目標匯出應是只讀取持久化狀態的小型函式；不要透過完整頻道 runtime barrel 轉接它。

`openclaw.channel.configuredState` 針對便宜的僅 env 已設定檢查遵循相同形狀：

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

當頻道可以從 env 或其他小型非 runtime 輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的頻道 runtime，請改將該邏輯保留在外掛 `config.hasConfiguredState` hook 中。

## 探索優先順序（重複外掛 id）

OpenClaw 會從三個根目錄探索外掛，並依此順序檢查：隨 OpenClaw 提供的內建外掛、全域安裝根目錄（`~/.openclaw/extensions`），以及目前工作區根目錄（`<workspace>/.openclaw/extensions`），再加上任何明確的 `plugins.load.paths` 項目。

如果兩個探索結果共用相同 `id`，只會保留**最高優先順序**的 manifest；較低優先順序的重複項會被捨棄，而不是並列載入。優先順序由高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **符合追蹤安裝記錄的全域安裝** — 透過 `openclaw plugin install`/`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤能為相同 id 識別的外掛，即使該 id 也屬於內建外掛
3. **內建** — 隨 OpenClaw 提供的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項

影響：

- 位於工作區或全域根目錄、未被追蹤的內建外掛 fork 或過期副本，不會遮蔽內建建置。
- 若要覆寫內建外掛，請為該 id 執行 `openclaw plugin install`，讓已追蹤的全域安裝優先於內建副本；或透過 `plugins.entries.<id>` 釘選特定路徑，讓它以設定選取優先順序勝出。
- 重複項捨棄會被記錄，讓 Doctor 與啟動診斷能指出被捨棄的副本。
- 設定選取的重複覆寫會在診斷中表述為明確覆寫，但仍會警告，讓過期 fork 與意外遮蔽保持可見。

## JSON Schema 需求

- **每個外掛都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空 schema 可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀寫時驗證，而不是在 runtime 驗證。
- 使用新的設定鍵擴充或 fork 內建外掛時，請同時更新該外掛的 `openclaw.plugin.json` `configSchema`。內建外掛 schema 是嚴格的，因此若在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，但未將 `myNewKey` 加入 `configSchema.properties`，則會在外掛 runtime 載入前被拒絕。

範例 schema 擴充：

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## 驗證行為

- 未知的 `channels.*` 鍵是**錯誤**，除非頻道 id 由外掛 manifest 宣告。如果相同 id 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs`（被引用但目前不可探索的外掛）中，OpenClaw 會將其降級為**警告**。
- `plugins.entries.<id>`、`plugins.allow` 與 `plugins.deny` 引用未知外掛 id 時是**警告**（「已忽略過期設定項目」），不是錯誤，因此升級和已移除/重新命名的外掛不會阻止閘道啟動。
- `plugins.slots.memory` 引用未知外掛 id 是**錯誤**，但已知的 `memory-lancedb` 官方外部外掛例外，會改為警告。
- 如果外掛已安裝，但 manifest 或 schema 損壞或遺失，驗證會失敗，Doctor 會回報外掛錯誤。
- 如果外掛設定存在但外掛已**停用**，設定會保留，且 Doctor + logs 中會顯示**警告**。

完整 `plugins.*` schema 請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- manifest 是**原生 OpenClaw 外掛的必要項目**，包括本機檔案系統載入。Runtime 仍會分開載入外掛模組；manifest 只用於探索 + 驗證。
- 原生 manifest 會以 JSON5 解析，因此只要最終值仍是物件，註解、尾隨逗號和未加引號的鍵都可接受。
- manifest 載入器只會讀取已文件化的 manifest 欄位。請避免自訂頂層鍵。
- 當外掛不需要時，可以省略 `channels`、`providers`、`cliBackends` 與 `skills`。
- `providerCatalogEntry` 必須保持輕量，且不應匯入廣泛的 runtime 程式碼；請用它放置靜態供應商目錄中繼資料或狹窄的探索描述子，而不是請求時執行。
- 專屬外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`（預設 `memory-core`），`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設 `legacy`）。
- 請在此 manifest 中宣告專屬外掛種類。Runtime-entry `OpenClawPluginDefinition.kind` 已棄用，且只作為較舊外掛的相容性備援保留。
- Env-var 中繼資料（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars`，以及 `channelEnvVars`）僅具宣告性。狀態、稽核、排程傳遞驗證和其他唯讀介面在將 env var 視為已設定之前，仍會套用外掛信任與有效啟用政策。
- 需要供應商程式碼的 runtime 精靈中繼資料，請參閱[供應商 runtime hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記錄建置步驟與任何套件管理器允許清單需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="rocket">
    外掛入門。
  </Card>
  <Card title="外掛架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概觀" href="/zh-TW/plugins/sdk-overview" icon="book">
    外掛 SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
