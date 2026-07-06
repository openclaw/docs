---
read_when:
    - 您正在建置 OpenClaw 外掛
    - 你需要交付外掛設定結構描述，或偵錯外掛驗證錯誤
summary: 外掛資訊清單 + JSON 結構描述需求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-06T21:51:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 317fa77e9e760777a64daa183c72118b78a75a786ca1ca5f8a3fbf289cadff02
    source_path: plugins/manifest.md
    workflow: 16
---

本頁涵蓋 **OpenClaw 原生外掛資訊清單** `openclaw.plugin.json`。如需相容套件版面配置（Codex、Claude、Cursor），請參閱[外掛套件](/zh-TW/plugins/bundles)。

相容套件格式會改用各自的資訊清單檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或沒有資訊清單的預設 Claude 元件版面配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些版面配置，但不會依照下方的 `openclaw.plugin.json` 結構描述驗證它們。對於相容套件，當版面配置符合 OpenClaw 的執行階段預期時，OpenClaw 會讀取套件中繼資料、宣告的技能根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的 hook 套件包。

每個原生 OpenClaw 外掛都**必須**在**外掛根目錄**提供 `openclaw.plugin.json`。OpenClaw 會讀取它，以便在**不執行外掛程式碼**的情況下驗證設定。缺少或無效的資訊清單會阻擋設定驗證，並被視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需原生能力模型與目前的外部相容性指引，請參閱[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的用途

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。其中的所有內容都必須足夠輕量，能在不啟動外掛執行階段的情況下檢查。

**用於：**

- 外掛身分、設定驗證，以及設定 UI 提示
- 驗證、上線引導與設定中繼資料（別名、自動啟用、提供者環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列所有權簡寫
- 靜態能力所有權快照（`contracts`）
- 共享 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併到目錄與驗證介面的通道特定設定中繼資料

**不要用於：**註冊執行階段行為、宣告程式碼進入點，或 npm 安裝中繼資料。這些應該放在你的外掛程式碼和 `package.json` 中。

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
| `id`                                 | 是       | `string`                     | 標準外掛 ID。這是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                          |
| `requiresPlugins`                    | 否       | `string[]`                   | 必須一併安裝才能讓此外掛生效的外掛 ID。探索會讓外掛保持可載入，但在缺少任何必要外掛時發出警告。                                                                                           |
| `enabledByDefault`                   | 否       | `true`                       | 將隨附外掛標記為預設啟用。省略它，或設定任何非 `true` 值，即可讓外掛預設停用。                                                                                                            |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 將隨附外掛標記為僅在列出的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍優先。                                                                                                    |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此標準外掛 ID 的舊版 ID。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提及時，應自動啟用此外掛的提供者 ID。                                                                                                                               |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告一個或多個由 `plugins.slots.*` 使用的互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個插槽的外掛會在同一個陣列中宣告兩種種類。                                             |
| `channels`                           | 否       | `string[]`                   | 由此外掛擁有的通道 ID。用於探索與設定驗證。                                                                                                                                                                                                             |
| `providers`                          | 否       | `string[]`                   | 由此外掛擁有的提供者 ID。                                                                                                                                                                                                                               |
| `providerCatalogEntry`               | 否       | `string`                     | 輕量提供者目錄模組路徑，相對於外掛根目錄，用於可在不啟動完整外掛執行階段的情況下載入的清單範圍提供者目錄中繼資料。                                                                       |
| `modelSupport`                       | 否       | `object`                     | 清單擁有的模型系列中繼資料簡寫，用於在執行階段前自動載入外掛。                                                                                                                           |
| `modelCatalog`                       | 否       | `object`                     | 此外掛擁有的提供者之宣告式模型目錄中繼資料。這是未來唯讀列表、初始設定、模型選擇器、別名與抑制功能在不載入外掛執行階段時使用的控制平面合約。                                             |
| `modelPricing`                       | 否       | `object`                     | 提供者擁有的外部價格查詢政策。用它讓本機/自行託管提供者退出遠端價格目錄，或在不於核心硬編碼提供者 ID 的情況下，將提供者參照對應到 OpenRouter/LiteLLM 目錄 ID。                            |
| `modelIdNormalization`               | 否       | `object`                     | 提供者擁有的模型 ID 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                       |
| `providerEndpoints`                  | 否       | `object[]`                   | 清單擁有的端點主機/baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                |
| `providerRequest`                    | 否       | `object`                     | 泛用請求政策在提供者執行階段載入前使用的輕量提供者系列與請求相容性中繼資料。                                                                                                             |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 提供者預設，讓設定或安裝介面可在核心未硬編碼提供者特定整合的情況下提供。                                                                                            |
| `cliBackends`                        | 否       | `string[]`                   | 由此外掛擁有的命令列介面推論後端 ID。用於從明確設定參照進行啟動自動啟用。                                                                                                                |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 提供者或命令列介面後端參照，其外掛擁有的合成驗證鉤子應在執行階段載入前，於冷模型探索期間被探測。                                                                                         |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 隨附外掛擁有的佔位 API 金鑰值，代表非機密的本機、OAuth 或環境憑證狀態。                                                                                                                   |
| `commandAliases`                     | 否       | `object[]`                   | 由此外掛擁有的命令名稱，應在執行階段載入前產生具外掛感知能力的設定與命令列介面診斷。                                                                                                     |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 已棄用的相容性環境中繼資料，用於提供者驗證/狀態查詢。新外掛請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此欄位。                                                    |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 僅用於用量/帳務的提供者憑證。OpenClaw 會將這些名稱用於用量探索與機密清理，但絕不會用於推論驗證。                                                                                         |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 應重用另一個提供者 ID 進行驗證查詢的提供者 ID，例如共用基礎提供者 API 金鑰與驗證設定檔的程式碼提供者。                                                                                    |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 可在不載入外掛程式碼的情況下檢查的輕量通道環境中繼資料。將此用於泛用啟動/設定輔助工具應看到的環境驅動通道設定或驗證介面。                                                       |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於初始設定選擇器、偏好提供者解析與簡單命令列介面旗標接線的輕量驗證選項中繼資料。                                                                                                       |
| `activation`                         | 否       | `object`                     | 用於啟動、提供者、命令、通道、路由與能力觸發載入的輕量啟用規劃器中繼資料。僅為中繼資料；實際行為仍由外掛執行階段擁有。                                                                   |
| `setup`                              | 否       | `object`                     | 輕量設定/初始導入描述元，讓探索與設定介面可在不載入外掛執行階段的情況下檢查。                                                                                                            |
| `qaRunners`                          | 否       | `object[]`                   | 共用 `openclaw qa` 主機在外掛執行階段載入前使用的輕量 QA 執行器描述元。                                                                                                                   |
| `contracts`                          | 否       | `object`                     | 外部驗證鉤子、嵌入、語音、即時轉錄、即時語音、媒體理解、圖片/影片/音樂生成、網路擷取、網路搜尋、文件/網頁內容擷取，以及工具擁有權的靜態能力擁有權快照。                                  |
| `configContracts`                    | 否       | `object`                     | 由泛用核心輔助工具使用、清單擁有的設定行為：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑收斂。請參閱 [configContracts 參考](#configcontracts-reference)。                            |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 針對 `contracts.mediaUnderstandingProviders` 中宣告的提供者 ID 的輕量媒體理解預設值。                                                                                                     |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.imageGenerationProviders` 中宣告的供應商 ID 的低成本圖片生成驗證中繼資料，包括供應商擁有的驗證別名與 base-url 防護。                                                                                       |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.videoGenerationProviders` 中宣告的供應商 ID 的低成本影片生成驗證中繼資料，包括供應商擁有的驗證別名與 base-url 防護。                                                                                       |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.musicGenerationProviders` 中宣告的供應商 ID 的低成本音樂生成驗證中繼資料，包括供應商擁有的驗證別名與 base-url 防護。                                                                                       |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 針對 `contracts.tools` 中宣告、由外掛擁有的工具的低成本可用性中繼資料。當工具不應載入執行階段，除非存在設定、環境或驗證證據時，請使用它。                                                                                |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 由資訊清單擁有的頻道設定中繼資料，會在執行階段載入前合併到探索與驗證介面。                                                                                                                                               |
| `skills`                             | 否       | `string[]`                   | 要載入的 Skills 目錄，相對於外掛根目錄。                                                                                                                                                                                                  |
| `name`                               | 否       | `string`                     | 人類可讀的外掛名稱。                                                                                                                                                                                                                              |
| `description`                        | 否       | `string`                     | 顯示在外掛介面中的簡短摘要。                                                                                                                                                                                                                  |
| `icon`                               | 否       | `string`                     | 用於市集/目錄卡片的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL，並在省略或無效時退回使用預設外掛圖示。                                                                                       |
| `version`                            | 否       | `string`                     | 資訊性外掛版本。                                                                                                                                                                                                                            |
| `uiHints`                            | 否       | `Record<string, object>`     | 設定欄位的 UI 標籤、預留位置與敏感性提示。                                                                                                                                                                                        |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述在相符的 `contracts.*GenerationProviders` 清單中宣告之提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具能在不匯入每個提供者外掛的情況下，判斷生成提供者是否可用。

這些欄位只用於低成本、宣告式的事實。傳輸、請求轉換、權杖重新整理、憑證驗證，以及實際的生成行為都留在外掛執行階段中。

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
| `aliases`              | 否   | `string[]` | 應視為該生成提供者靜態驗證別名的其他提供者 ID。                                                                                           |
| `authProviders`        | 否   | `string[]` | 其已設定驗證設定檔應視為此生成提供者驗證的提供者 ID。                                                                                     |
| `configSignals`        | 否   | `object[]` | 針對可在沒有驗證設定檔或環境變數的情況下設定之本機或自行託管提供者的低成本、僅設定可用性訊號。                                             |
| `authSignals`          | 否   | `object[]` | 明確的驗證訊號。存在時，這些訊號會取代來自提供者 ID、`aliases` 和 `authProviders` 的預設訊號集。                                           |
| `referenceAudioInputs` | 否   | `boolean`  | 僅限影片生成。當提供者接受參考音訊素材時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。                                           |

每個 `configSignals` 項目支援：

| 欄位             | 必填 | 類型       | 含義                                                                                                                                                                             |
| ---------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是   | `string`   | 要檢查的外掛擁有設定物件的點路徑，例如 `plugins.entries.example.config`。                                                                                                       |
| `overlayPath`    | 否   | `string`   | 根設定內的點路徑，其物件應在評估訊號前覆蓋根物件。請將此用於能力專屬設定，例如 `image`、`video` 或 `music`。                                                                    |
| `overlayMapPath` | 否   | `string`   | 根設定內的點路徑，其物件值應各自覆蓋根物件。請將此用於具名帳戶映射，例如 `accounts`，其中任何已設定帳戶都應符合資格。                                                           |
| `required`       | 否   | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不得為空；物件和陣列不得為空。                                                                                                         |
| `requiredAny`    | 否   | `string[]` | 有效設定內至少其中之一必須具有已設定值的點路徑。                                                                                                                               |
| `mode`           | 否   | `object`   | 有效設定內的選用字串模式防護。當僅設定可用性只適用於某一種模式時使用。                                                                                                         |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                         |
| ------------ | ---- | ---------- | ---------------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                          |
| `default`    | 否   | `string`   | 當設定省略該路徑時使用的模式值。                                             |
| `allowed`    | 否   | `string[]` | 如果存在，只有當有效模式是這些值之一時，訊號才會通過。                       |
| `disallowed` | 否   | `string[]` | 如果存在，當有效模式是這些值之一時，訊號會失敗。                             |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                                           |
| ----------------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                       |
| `providerBaseUrl` | 否   | `object` | 選用防護，只有在參照的已設定提供者使用允許的基底 URL 時，才會讓該訊號計入。當驗證別名只對特定 API 有效時使用。                                                |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                      |
| ----------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的提供者設定 ID。                                                                                                    |
| `defaultBaseUrl`  | 否   | `string`   | 當提供者設定省略 `baseUrl` 時假設使用的基底 URL。                                                                                         |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設基底 URL 與這些正規化值之一不相符時，該訊號會被忽略。                                            |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 形狀，並以工具名稱作為鍵。`contracts.tools` 宣告所有權。`toolMetadata` 宣告低成本可用性證據，讓 OpenClaw 能避免只為了讓工具工廠回傳 `null` 而匯入外掛執行階段。

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

除了上述共用的 `configSignals`/`authSignals` 欄位之外，`toolMetadata` 項目也接受 `optional`（將工具標記為外掛啟用時非必要）和 `replaySafe`（將工具執行標記為可在不完整模型回合後安全重複）。

如果工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於其工廠取決於驗證/設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個上線導引或驗證選擇。OpenClaw 會在提供者執行階段載入前讀取此資訊。提供者設定清單會使用這些清單選擇、從描述元衍生的設定選擇，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填     | 類型                                                                  | 意義                                                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                                              | 此選項所屬的提供者 ID。                                                                             |
| `method`              | 是       | `string`                                                              | 要分派到的驗證方法 ID。                                                                             |
| `choiceId`            | 是       | `string`                                                              | 上手流程與命令列介面流程使用的穩定驗證選項 ID。                                                     |
| `choiceLabel`         | 否       | `string`                                                              | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                          |
| `choiceHint`          | 否       | `string`                                                              | 選擇器的簡短輔助文字。                                                                               |
| `assistantPriority`   | 否       | `number`                                                              | 較低的值會在助理驅動的互動式選擇器中排序較前。                                                       |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                                        | 從助理選擇器中隱藏此選項，同時仍允許手動命令列介面選取。                                             |
| `deprecatedChoiceIds` | 否       | `string[]`                                                            | 應將使用者重新導向到此替代選項的舊版選項 ID。                                                        |
| `groupId`             | 否       | `string`                                                              | 用於群組相關選項的選用群組 ID。                                                                      |
| `groupLabel`          | 否       | `string`                                                              | 該群組面向使用者的標籤。                                                                             |
| `groupHint`           | 否       | `string`                                                              | 群組的簡短輔助文字。                                                                                 |
| `onboardingFeatured`  | 否       | `boolean`                                                             | 在互動式上手流程選擇器的精選層級中顯示此群組，位於「更多...」項目之前。                              |
| `optionKey`           | 否       | `string`                                                              | 簡單單一旗標驗證流程的內部選項鍵。                                                                   |
| `cliFlag`             | 否       | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                    |
| `cliOption`           | 否       | `string`                                                              | 完整命令列介面選項形式，例如 `--openrouter-api-key <key>`。                                          |
| `cliDescription`      | 否       | `string`                                                              | 命令列介面說明中使用的描述。                                                                         |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些上手流程介面中。若省略，預設為 `["text-inference"]`。                              |

## commandAliases 參考

當外掛擁有使用者可能誤放進 `plugins.allow`，或嘗試作為根命令列介面命令執行的執行階段命令名稱時，請使用 `commandAliases`。OpenClaw 會使用這項中繼資料進行診斷，而不匯入外掛執行階段程式碼。

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

| 欄位         | 必填     | 類型              | 意義                                                                    |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 是       | `string`          | 屬於此外掛的命令名稱。                                                  |
| `kind`       | 否       | `"runtime-slash"` | 將別名標記為聊天斜線命令，而不是根命令列介面命令。                      |
| `cliCommand` | 否       | `string`          | 若存在，建議用於命令列介面操作的相關根命令列介面命令。                  |

## activation 參考

當外掛可以低成本宣告哪些控制平面事件應將其納入啟用/載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為，不會取代 `register(...)`，也不保證外掛程式碼已經執行。啟用規劃器會使用這些欄位在退回既有清單擁有權中繼資料之前縮小候選外掛範圍，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和掛鉤。

偏好使用已能描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述元或 `contracts` 能表達該關係時，請使用這些欄位。對於無法由這些擁有權欄位表示的額外規劃器提示，請使用 `activation`。對於命令列介面執行階段別名，例如 `claude-cli`、`my-cli` 或 `google-gemini-cli`，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅用於尚未有擁有權欄位的嵌入式代理程式承載器 ID。

每個外掛都應有意識地設定 `activation.onStartup`。只有當外掛必須在閘道啟動期間執行時，才將其設為 `true`。當外掛在啟動時是惰性的，且應只由較窄的觸發條件載入時，將其設為 `false`。省略 `onStartup` 不再會隱含地在啟動時載入外掛；請為啟動、頻道、設定、代理程式承載器、記憶體或其他較窄的啟用觸發條件使用明確的啟用中繼資料。

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

| 欄位               | 必填     | 類型                                                 | 意義                                                                                                                                                                                    |
| ------------------ | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否       | `boolean`                                            | 明確的閘道啟動啟用。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 會讓外掛保持啟動惰性，除非另一個相符的觸發條件需要載入。 |
| `onProviders`      | 否       | `string[]`                                           | 應將此外掛納入啟用/載入計畫的提供者 ID。                                                                                                                                                 |
| `onAgentHarnesses` | 否       | `string[]`                                           | 應將此外掛納入啟用/載入計畫的嵌入式代理程式承載器執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                      |
| `onCommands`       | 否       | `string[]`                                           | 應將此外掛納入啟用/載入計畫的命令 ID。                                                                                                                                                   |
| `onChannels`       | 否       | `string[]`                                           | 應將此外掛納入啟用/載入計畫的頻道 ID。                                                                                                                                                   |
| `onRoutes`         | 否       | `string[]`                                           | 應將此外掛納入啟用/載入計畫的路由種類。                                                                                                                                                 |
| `onConfigPaths`    | 否       | `string[]`                                           | 當路徑存在且未明確停用時，應將此外掛納入啟動/載入計畫的根相對設定路徑。                                                                                                                   |
| `onCapabilities`   | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時請偏好較窄的欄位。                                                                                                                             |

目前的即時消費者：

- 閘道啟動規劃使用 `activation.onStartup` 進行明確的啟動匯入。
- 命令觸發的命令列介面規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理程式執行階段啟動規劃會將 `activation.onAgentHarnesses` 用於嵌入式承載器，並將頂層 `cliBackends[]` 用於命令列介面執行階段別名。
- 頻道觸發的設定/頻道規劃會在缺少明確的頻道啟用中繼資料時，退回使用舊版 `channels[]` 擁有權。
- 啟動外掛規劃會將 `activation.onConfigPaths` 用於非頻道根設定介面，例如內建瀏覽器外掛的 `browser` 區塊。
- 提供者觸發的設定/執行階段規劃會在缺少明確的提供者啟用中繼資料時，退回使用舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權。

規劃器診斷可以區分明確的啟用提示與清單擁有權退回。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤供主機診斷與測試使用；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當外掛在共用的 `openclaw qa` 根之下貢獻一個或多個傳輸執行器時，請使用 `qaRunners`。保持此中繼資料低成本且靜態；外掛執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際的命令列介面註冊，該介面會匯出相符的 `qaRunnerCliRegistrations`。選用的 `adapterFactory` 會將傳輸公開給共用 QA 情境，而不改變已註冊命令的執行器。

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

| 欄位          | 必填     | 類型     | 意義                                                               |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是       | `string` | 掛載在 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否       | `string` | 當共用主機需要存根命令時使用的退回說明文字。                       |

`adapterFactory` ID 必須符合 `commandName`。不要匯出資訊清單中不存在的命令註冊。

## setup 參考

當設定與入門引導介面需要在執行階段載入前取得低成本、由外掛擁有的中繼資料時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並會繼續描述命令列介面推論後端。`setup.cliBackends` 是針對控制平面與設定流程的設定專用描述元介面，這些流程應維持僅使用中繼資料。

存在時，`setup.providers` 與 `setup.cliBackends` 是設定探索偏好的描述元優先查找介面。如果描述元只縮小候選外掛範圍，而設定仍需要更豐富的設定期間執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 也會在通用提供者驗證與環境變數查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在棄用期間仍透過相容性配接器支援，但仍使用它的非內建外掛會收到資訊清單診斷。新外掛應將設定與狀態環境中繼資料放在 `setup.providers[].envVars`。

當帳單或組織層級憑證必須啟用 `resolveUsageAuth`，但不應成為推論憑證時，請使用 `providerUsageAuthEnvVars`。這些名稱會加入工作區 dotenv 封鎖、ACP 子程序剝除、沙箱祕密篩選，以及廣泛的祕密清理。提供者執行階段仍會在 `resolveUsageAuth` 內讀取並分類該值。

OpenClaw 也可以在沒有設定項目可用時，或在 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，從 `setup.providers[].authMethods` 推導簡單的設定選項。若需要自訂標籤、命令列介面旗標、入門引導範圍與助理中繼資料，明確的 `providerAuthChoices` 項目仍是偏好做法。

只有當這些描述元足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述元合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 來進行設定查找。如果僅描述元外掛仍隨附其中一種設定執行階段項目，OpenClaw 會回報附加診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版備援行為，因此既有外掛即使已新增描述元但未加入該旗標，也不會中斷。

由於設定查找可能會執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 與 `setup.cliBackends[]` 值必須在所有探索到的外掛之間保持唯一。所有權不明確時會封閉失敗，而不是依探索順序挑選勝出者。

當設定執行階段確實執行時，如果 `setup-api` 註冊了資訊清單描述元未宣告的提供者或命令列介面後端，或描述元沒有相符的執行階段註冊，設定登錄診斷會回報描述元漂移。這些診斷是附加性的，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位 | 必填 | 類型 | 意義 |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 設定或入門引導期間公開的提供者 ID。請保持正規化 ID 全域唯一。 |
| `authMethods` | 否 | `string[]` | 此提供者在不載入完整執行階段時支援的設定與驗證方法 ID。 |
| `envVars` | 否 | `string[]` | 通用設定與狀態介面可在外掛執行階段載入前檢查的環境變數。 |
| `authEvidence` | 否 | `object[]` | 可透過非祕密標記驗證的提供者低成本本機驗證證據檢查。 |

`authEvidence` 用於提供者擁有的本機憑證標記，可在不載入執行階段程式碼的情況下驗證。這些檢查必須維持低成本且本機化：不得進行網路呼叫、不得讀取鑰匙圈或祕密管理器、不得執行 shell 命令，也不得探測提供者 API。

支援的證據項目：

| 欄位 | 必填 | 類型 | 意義 |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type` | 是 | `string` | 目前為 `local-file-with-env`。 |
| `fileEnvVar` | 否 | `string` | 包含明確憑證檔案路徑的環境變數。 |
| `fallbackPaths` | 否 | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 與 `${APPDATA}`。 |
| `requiresAnyEnv` | 否 | `string[]` | 列出的環境變數中至少一個必須非空，證據才有效。 |
| `requiresAllEnv` | 否 | `string[]` | 列出的每個環境變數都必須非空，證據才有效。 |
| `credentialMarker` | 是 | `string` | 證據存在時傳回的非祕密標記。 |
| `source` | 否 | `string` | 用於驗證與狀態輸出的使用者可見來源標籤。 |

### setup 欄位

| 欄位 | 必填 | 類型 | 意義 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 設定與入門引導期間公開的提供者設定描述元。 |
| `cliBackends` | 否 | `string[]` | 用於描述元優先設定查找的設定期間後端 ID。請保持正規化 ID 全域唯一。 |
| `configMigrations` | 否 | `string[]` | 此外掛設定介面擁有的設定遷移 ID。 |
| `requiresRuntime` | 否 | `boolean` | 設定在描述元查找後是否仍需要執行 `setup-api`。 |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型呈現提示的對照表。

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

| 欄位 | 類型 | 意義 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 使用者可見的欄位標籤。 |
| `help` | `string` | 簡短輔助文字。 |
| `tags` | `string[]` | 選用的介面標籤。 |
| `advanced` | `boolean` | 將欄位標記為進階。 |
| `sensitive` | `boolean` | 將欄位標記為祕密或敏感。 |
| `placeholder` | `string` | 表單輸入的預留位置文字。 |

## contracts 參考

只有在 OpenClaw 可不匯入外掛執行階段即可讀取靜態能力所有權中繼資料時，才使用 `contracts`。

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
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每個清單都是選用的：

| 欄位                             | 類型       | 含義                                                                                                                                     |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory id，目前為 `codex-app-server`。                                                                        |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果 middleware 的執行階段 id。                                                                                     |
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任前置工具政策 id。隨附外掛可在沒有此欄位的情況下註冊政策。                                               |
| `externalAuthProviders`          | `string[]` | 此外掛擁有其外部驗證設定檔 hook 的提供者 id。                                                                                           |
| `embeddingProviders`             | `string[]` | 此外掛擁有的通用嵌入提供者 id，用於可重用的向量嵌入用途，包括記憶。                                                                     |
| `speechProviders`                | `string[]` | 此外掛擁有的語音提供者 id。                                                                                                             |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄提供者 id。                                                                                                         |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音提供者 id。                                                                                                         |
| `memoryEmbeddingProviders`       | `string[]` | 已棄用的記憶專用嵌入提供者 id，由此外掛擁有。                                                                                           |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解提供者 id。                                                                                                         |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源提供者 id。                                                                                                       |
| `documentExtractors`             | `string[]` | 此外掛擁有的文件（例如 PDF）擷取器提供者 id。                                                                                           |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的影像生成提供者 id。                                                                                                         |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成提供者 id。                                                                                                         |
| `musicGenerationProviders`       | `string[]` | 此外掛擁有的音樂生成提供者 id。                                                                                                         |
| `webContentExtractors`           | `string[]` | 此外掛擁有的網頁內容擷取提供者 id。                                                                                                     |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取提供者 id。                                                                                                         |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋提供者 id。                                                                                                         |
| `usageProviders`                 | `string[]` | 此外掛擁有其使用量驗證與使用量快照 hook 的提供者 id。                                                                                   |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 擁有的匯入提供者 id。                                                                                       |
| `gatewayMethodDispatch`          | `string[]` | 已驗證外掛 HTTP 路由的保留授權，可在程序內派送閘道方法。                                                                                |
| `tools`                          | `string[]` | 此外掛擁有的代理工具名稱。                                                                                                             |

`contracts.embeddedExtensionFactories` 會保留給僅限隨附 Codex app-server 的 extension factory。隨附工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並透過 `api.registerAgentToolResultMiddleware(...)` 註冊。已安裝外掛只有在明確啟用時，且僅限其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段，才可使用相同的 middleware 接縫。

需要主機受信任前置工具政策層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機 id，並且必須明確啟用。隨附外掛保留既有受信任政策路徑，但具有未宣告政策 id 的已安裝外掛會在註冊前遭拒。政策 id 以註冊的外掛為範圍，因此兩個外掛都可以宣告並註冊 `workflow-budget`；單一外掛不可重複註冊相同的本機 id。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，只載入可能擁有所請求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的提供者外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證 hook 會被忽略。

同時實作 `resolveUsageAuth` 和 `fetchUsageSnapshot` 的提供者外掛，應在 `contracts.usageProviders` 中宣告每個自動探索到的提供者 id。使用量探索會先讀取此契約，再載入執行階段程式碼，然後只在載入已宣告擁有者後驗證兩個 hook。

通用嵌入提供者應為每個透過 `api.registerEmbeddingProvider(...)` 註冊的介面卡宣告 `contracts.embeddingProviders`。請將通用契約用於可重用的向量生成，包括由記憶搜尋消耗的提供者。`contracts.memoryEmbeddingProviders` 是已棄用的記憶專用相容性，僅在現有提供者遷移至通用嵌入提供者接縫期間保留。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。它是原生外掛 HTTP 路由的 API 衛生閘門，用於有意在程序內派送閘道控制平面方法；它不是用來防範惡意原生外掛的沙盒。僅將其用於已經要求閘道 HTTP 驗證，且經過嚴格審查的隨附或操作者介面。

## configContracts 參考

將 `configContracts` 用於由 manifest 擁有、且通用核心輔助工具需要但不匯入外掛執行階段的設定行為：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑縮窄。

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

| 欄位                          | 必填 | 類型       | 含義                                                                                                                                                                                                 |
| ----------------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否   | `string[]` | 根目錄相對設定路徑，表示此外掛的設定時相容性遷移可能適用。當設定從未參照此外掛時，讓通用執行階段設定讀取可略過每個外掛設定介面。       |
| `compatibilityRuntimePaths`   | 否   | `string[]` | 此外掛可在執行階段、外掛程式碼完全啟用前服務的根目錄相對相容性路徑。用於應縮窄隨附候選集合、但不匯入每個相容外掛執行階段的舊版介面。 |
| `dangerousFlags`              | 否   | `object[]` | 啟用時 `openclaw doctor` 應標記為不安全或危險的設定字面值。見下文。                                                                    |
| `secretInputs`                | 否   | `object`   | `plugins.entries.<id>.config` 下的設定路徑，SecretRef 遷移／稽核目標登錄應將其視為秘密形態字串。見下文。                               |

每個 `dangerousFlags` 項目支援：

| 欄位     | 必填 | 類型                                  | 含義                                                                                                     |
| -------- | ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `path`   | 是   | `string`                              | 相對於 `plugins.entries.<id>.config` 的點分隔設定路徑。支援對 map／array 片段使用 `*` 萬用字元。        |
| `equals` | 是   | `string \| number \| boolean \| null` | 將此設定值標記為危險的精確字面值。                                                                     |

`secretInputs` 支援：

| 欄位                    | 必填 | 類型       | 含義                                                                                                                                                                          |
| ----------------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否   | `boolean`  | 判斷此 SecretRef 介面是否啟用時，覆寫隨附外掛預設啟用狀態。當外掛為隨附外掛，但該介面應在設定中明確啟用前保持停用時使用。                                                   |
| `paths`                 | 是   | `object[]` | 秘密形態設定路徑，每個都有 `path`（點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元）以及選用的 `expected`（目前僅支援 `"string"`）。                            |

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證備援優先順序，或原生文件支援，且通用核心輔助工具需要在執行階段載入前取得這些資訊時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

每個提供者項目可以包含：

| 欄位                  | 類型                                                             | 含義                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此供應商公開的媒體能力。                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | 設定未指定模型時使用的能力對模型預設值。                                         |
| `autoPriority`         | `Record<string, number>`                                         | 數字較小者會在自動、以憑證為基礎的供應商備援中較早排序。                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 供應商支援的原生文件輸入。                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 依文件類型設定的模型覆寫。設定 `image: false` 可停用該文件類型的影像式擷取。 |

## channelConfigs 參考

當頻道外掛需要在執行階段載入前取得低成本設定中繼資料時，請使用 `channelConfigs`。唯讀的頻道設定/狀態探索可以在沒有可用設定項目時，或在 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，直接對已設定的外部頻道使用此中繼資料。

`channelConfigs` 是外掛清單中繼資料，不是新的頂層使用者設定區段。使用者仍會在 `channels.<channel-id>` 下設定頻道實例。OpenClaw 會讀取清單中繼資料，以在外掛執行階段程式碼執行前判定哪個外掛擁有該已設定頻道。

對於頻道外掛，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非內建外掛也應宣告相符的 `channelConfigs` 項目。若沒有這些項目，OpenClaw 仍可載入外掛，但冷路徑設定結構描述、設定流程和 Control UI 介面必須等到外掛執行階段執行後，才能知道頻道所擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以為頻道執行階段載入前執行的命令設定檢查宣告靜態 `auto` 預設值。內建頻道也可以透過 `package.json#openclaw.channel.commands` 發布相同預設值，並與其他由套件擁有的頻道目錄中繼資料並列。

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

| 欄位         | 類型                     | 含義                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個宣告的頻道設定項目都必須提供。         |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤、預留文字與敏感提示。          |
| `label`       | `string`                 | 當執行階段中繼資料尚未就緒時，合併到選擇器與檢查介面的頻道標籤。 |
| `description` | `string`                 | 用於檢查與目錄介面的簡短頻道描述。                               |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。       |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於其上的舊版或較低優先順序外掛 ID。    |

### 取代另一個頻道外掛

當你的外掛是某個頻道 ID 的偏好擁有者，而另一個外掛也能提供該頻道 ID 時，請使用 `preferOver`。常見情境包括重新命名的外掛 ID、取代內建外掛的獨立外掛，或為了設定相容性而保留相同頻道 ID 的維護中分支。

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

設定 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 與偏好外掛 ID。如果較低優先順序的外掛只是因為它是內建或預設啟用才被選取，OpenClaw 會在有效執行階段設定中停用它，讓一個外掛擁有該頻道及其工具。明確的使用者選擇仍然優先：如果使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇，並回報重複頻道/工具診斷，而不是默默變更請求的外掛集合。

請將 `preferOver` 限定於確實能提供相同頻道的外掛 ID。它不是一般優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在外掛執行階段載入前，從像 `gpt-5.5` 或 `claude-sonnet-4.6` 這樣的簡寫模型 ID 推斷你的供應商外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用以下優先順序：

- 明確的 `provider/model` 參照會使用所屬的 `providers` 清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非內建外掛和一個內建外掛都符合，非內建外掛優先
- 其餘歧義會被忽略，直到使用者或設定指定供應商

欄位：

| 欄位           | 類型       | 含義                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 以 `startsWith` 對簡寫模型 ID 進行比對的前綴。                 |
| `modelPatterns` | `string[]` | 移除設定檔尾碼後，對簡寫模型 ID 進行比對的正規表示式來源。 |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯，該函式會拒絕包含巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被默默略過，與語法無效的正規表示式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考

當 OpenClaw 應在載入外掛執行階段前知道供應商模型中繼資料時，請使用 `modelCatalog`。這是清單所擁有的固定目錄列、供應商別名、抑制規則與探索模式來源。執行階段重新整理仍屬於供應商執行階段程式碼，但清單會告訴核心何時需要執行階段。

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

| 欄位            | 類型                                                     | 含義                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此外掛擁有的供應商 ID 目錄列。鍵也應出現在頂層 `providers` 中。       |
| `aliases`        | `Record<string, object>`                                 | 應解析為所擁有供應商的供應商別名，用於目錄或抑制規劃。              |
| `suppressions`   | `object[]`                                               | 此外掛因供應商特定原因而抑制的、來自另一來源的模型列。                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 供應商目錄是否可從清單中繼資料讀取、重新整理到快取，或需要執行階段。 |
| `runtimeAugment` | `boolean`                                                | 只有當供應商執行階段必須在清單/設定規劃後附加目錄列時，才設定為 `true`。       |

`aliases` 會參與模型目錄規劃的供應商擁有權查找。別名目標必須是同一外掛擁有的頂層供應商。當以供應商篩選的清單使用別名時，OpenClaw 可以讀取所屬清單，並套用別名 API/基底 URL 覆寫，而不載入供應商執行階段。別名不會展開未篩選的目錄清單；廣泛清單只會發出所屬的標準供應商列。

`suppressions` 取代舊的供應商執行階段 `suppressBuiltInModel` 鉤子。只有當供應商由此外掛擁有，或宣告為以所擁有供應商為目標的 `modelCatalog.aliases` 鍵時，抑制項目才會被採用。模型解析期間不再呼叫執行階段抑制鉤子。

供應商欄位：

| 欄位     | 類型                     | 含義                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此供應商目錄中模型的選用預設基底 URL。    |
| `api`     | `ModelApi`               | 此供應商目錄中模型的選用預設 API 介面卡。 |
| `headers` | `Record<string, string>` | 套用於此供應商目錄的選用靜態標頭。      |
| `models`  | `object[]`               | 必填的模型列。沒有 `id` 的列會被忽略。            |

模型欄位：

| 欄位              | 型別                                                           | 意義                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供者本地模型 ID，不含 `provider/` 前綴。                    |
| `name`             | `string`                                                       | 選用的顯示名稱。                                                      |
| `api`              | `ModelApi`                                                     | 選用的每模型 API 覆寫。                                            |
| `baseUrl`          | `string`                                                       | 選用的每模型基礎 URL 覆寫。                                       |
| `headers`          | `Record<string, string>`                                       | 選用的每模型靜態標頭。                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被靜默丟棄。            |
| `reasoning`        | `boolean`                                                      | 模型是否公開推理行為。                               |
| `contextWindow`    | `number`                                                       | 原生提供者情境視窗。                                             |
| `contextTokens`    | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段情境上限。 |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出 token 數。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的每思考層級模型 ID 或參數覆寫。                    |
| `cost`             | `object`                                                       | 選用的每百萬 token 美元定價，包含選用的 `tieredPricing`。 |
| `compat`           | `object`                                                       | 選用的相容性旗標，符合 OpenClaw 模型設定相容性。  |
| `mediaInput`       | `object`                                                       | 選用的每模態輸入設定，目前僅支援影像。                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有在該列完全不應出現時才抑制。          |
| `statusReason`     | `string`                                                       | 選用的原因，會與非可用狀態一起顯示。                            |
| `replaces`         | `string[]`                                                     | 此模型取代的較舊提供者本地模型 ID。                       |
| `replacedBy`       | `string`                                                       | 已淘汰列的替代提供者本地模型 ID。                    |
| `tags`             | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                    |

抑制欄位：

| 欄位                      | 型別       | 意義                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此外掛擁有，或宣告為已擁有的別名。 |
| `model`                    | `string`   | 要抑制的提供者本地模型 ID。                                                                      |
| `reason`                   | `string`   | 直接要求被抑制列時顯示的選用訊息。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的選用有效提供者基礎 URL 主機清單。               |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確提供者設定 `api` 值選用清單。              |

不要將僅供執行階段使用的資料放入 `modelCatalog`。只有在 manifest 列足夠完整，可讓依提供者篩選的列表與選擇器介面略過 registry/執行階段探索時，才使用 `static`。當 manifest 列是有用、可列出的種子或補充資料，但稍後的重新整理/快取可以加入更多列時，使用 `refreshable`；refreshable 列本身不具權威性。當 OpenClaw 必須載入提供者執行階段才能知道列表時，使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、由提供者擁有的模型 ID 清理，且必須在提供者執行階段載入前發生。這會把短模型名稱、提供者本地舊版 ID，以及代理前綴規則等別名保留在所屬外掛 manifest 中，而不是放在核心模型選擇表內。

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

| 欄位                                | 型別                    | 意義                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依照寫入內容回傳。                  |
| `stripPrefixes`                      | `string[]`              | 別名查找前要移除的前綴，適用於舊版提供者/模型重複情況。     |
| `prefixWhenBare`                     | `string`                | 正規化模型 ID 尚未包含 `/` 時要加入的前綴。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。 |

## providerEndpoints 參考

使用 `providerEndpoints` 進行端點分類，讓通用請求政策可在提供者執行階段載入前得知。核心仍然擁有每個 `endpointClass` 的意義；外掛 manifest 擁有主機與基礎 URL 中繼資料。

已正式外部化的提供者外掛會從核心 dist 中排除，因此
它們的 manifest 在安裝前不可見。它們的 `providerEndpoints` 也必須
鏡像到 `scripts/lib/official-external-provider-catalog.json`，讓
端點分類在沒有外掛時仍能運作；合約測試會強制檢查此鏡像。

端點欄位：

| 欄位                          | 型別       | 意義                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機後綴。以 `.` 作為前綴可只比對網域後綴。 |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) 基礎 URL。                             |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機中移除的後綴，用於公開 Google Vertex 區域前綴。                 |

## providerRequest 參考

使用 `providerRequest` 提供低成本請求相容性中繼資料，讓通用請求政策無需載入提供者執行階段即可使用。將特定行為的 payload 重寫保留在提供者執行階段 hook 或共用提供者家族輔助工具中。

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

| 欄位                 | 型別         | 意義                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用請求相容性決策與診斷使用的提供者家族標籤。 |
| `compatibilityFamily` | `"moonshot"` | 共用請求輔助工具的選用提供者家族相容性分組。              |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。       |

## secretProviderIntegrations 參考

當外掛可以發布可重用的 SecretRef exec 提供者預設時，使用 `secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料，將外掛所有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際密鑰解析交給 SecretRef 執行階段。預設只會針對內建外掛，以及從受管理外掛安裝根目錄探索到的已安裝外掛公開，例如 git 和 ClawHub 安裝。

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

對應表鍵是整合 ID。如果省略 `providerAlias`，OpenClaw 會使用整合 ID 作為 SecretRef 提供者別名。提供者別名必須符合一般 SecretRef 提供者別名模式，例如 `team-secrets` 或 `onepassword-work`。

當操作者選取預設時，OpenClaw 會寫入如下提供者參照：

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

啟動/重新載入時，OpenClaw 會透過載入目前外掛 manifest 中繼資料來解析該提供者，檢查擁有外掛是否已安裝且啟用，並從 manifest 具體化 exec 命令。停用或移除外掛會撤銷 active SecretRef 的提供者。想要獨立 exec 設定的操作者，仍可直接撰寫手動 `command`/`args` 提供者。

目前僅支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]` 必須是 `./` 外掛根目錄相對解析器指令碼。OpenClaw 會在啟動/重新載入時，將它具體化為目前的 Node 可執行檔，以及外掛內指令碼的絕對路徑。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 選項不屬於 manifest 預設合約。需要非 Node 命令的操作者，可以直接設定獨立的手動 exec 提供者。

OpenClaw 會從外掛根目錄，以及對於 `${node}` 預設集，從目前節點可執行檔目錄衍生 manifest 預設集的 `trustedDirs`。manifest 作者撰寫的 `trustedDirs` 會被忽略。其他 exec 提供者選項，例如 `timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath`，會傳遞至一般 SecretRef exec 提供者設定。

## modelPricing 參考

當提供者需要在執行階段載入前控制平面定價行為時，請使用 `modelPricing`。閘道定價快取會讀取這些中繼資料，而不匯入提供者執行階段程式碼。

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
| `external`   | `boolean`         | 對於絕不應擷取 OpenRouter 或 LiteLLM 定價的本機/自行託管提供者，設為 `false`。                    |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此提供者的 OpenRouter 查詢。                                |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此提供者的 LiteLLM 查詢。                                      |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 id 不同於 OpenClaw 提供者 id 時使用，例如 `zai` 提供者的 `z-ai`。                            |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 id 視為巢狀提供者/模型參照，適用於 OpenRouter 這類代理提供者。                               |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 id 變體。`version-dots` 會嘗試像 `claude-opus-4.6` 這樣的點號版本 id。                     |

### OpenClaw 提供者索引

OpenClaw 提供者索引是 OpenClaw 擁有的預覽中繼資料，適用於其外掛可能尚未安裝的提供者。它不是外掛 manifest 的一部分。外掛 manifest 仍是已安裝外掛的權威來源。提供者索引是內部備援合約，供未來可安裝提供者和預先安裝模型選擇器介面在提供者外掛未安裝時使用。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛 manifest `modelCatalog`。
3. 來自明確重新整理的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

提供者索引不得包含祕密、啟用狀態、執行階段鉤子，或即時帳戶專屬模型資料。其預覽目錄使用與外掛 manifest 相同的 `modelCatalog` 提供者列形狀，但應限於穩定的顯示中繼資料，除非像 `api`、`baseUrl`、定價或相容性旗標這類執行階段配接器欄位被刻意保持與已安裝外掛 manifest 對齊。具備即時 `/models` 探索的提供者，應透過明確模型目錄快取路徑寫入重新整理的列，而不是讓一般列表或 onboarding 呼叫提供者 API。

提供者索引項目也可以攜帶可安裝外掛中繼資料，適用於其外掛已移出核心或尚未安裝的提供者。此中繼資料對應通道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及低成本的驗證選擇標籤，已足以顯示可安裝的設定選項。一旦外掛安裝完成，其 manifest 會優先，且該提供者的提供者索引項目會被忽略。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層 manifest 能力鍵遷移至 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些鍵（或任何其他能力清單）已不再作為頂層 manifest 欄位讀取；一般 manifest 載入只會辨識 `contracts` 底下的欄位。

## Manifest 與 package.json

這兩個檔案有不同用途：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選擇中繼資料，以及必須在外掛程式碼執行前存在的 UI 提示                                                        |
| `package.json`         | npm 中繼資料、相依性安裝，以及用於進入點、安裝閘門、設定或目錄中繼資料的 `openclaw` 區塊                                       |

如果你不確定某項中繼資料應該放在哪裡，請使用這條規則：

- 如果 OpenClaw 必須在載入外掛程式碼前知道它，請放在 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放在 `package.json`

### 影響探索的 package.json 欄位

部分執行前外掛中繼資料刻意放在 `package.json` 的 `openclaw` 區塊底下，而不是 `openclaw.plugin.json`。`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw 外掛合約；原生外掛必須使用 `openclaw.plugin.json` 加上下方支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 含義                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須留在外掛套件目錄內。                                                                                                                                        |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的已建置 JavaScript 執行階段進入點。必須留在外掛套件目錄內。                                                                                                          |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定進入點，用於 onboarding、延遲通道啟動，以及唯讀通道狀態/SecretRef 探索。必須留在外掛套件目錄內。                                                                       |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的已建置 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須留在外掛套件目錄內。                                                                              |
| `openclaw.channel`                                                                         | 低成本通道目錄中繼資料，例如標籤、文件路徑、別名和選取文案。                                                                                                                        |
| `openclaw.channel.commands`                                                                | 靜態原生命令和原生 skill 自動預設中繼資料，供設定、稽核和命令清單介面在通道執行階段載入前使用。                                                                                   |
| `openclaw.channel.configuredState`                                                         | 輕量已設定狀態檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已存在僅 env 設定？」                                                                                   |
| `openclaw.channel.persistedAuthState`                                                      | 輕量持久化驗證檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已有任何登入？」                                                                                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 針對內建和外部發布外掛的安裝/更新提示。                                                                                                                                            |
| `openclaw.install.defaultChoice`                                                           | 當有多個安裝來源可用時的偏好安裝路徑。                                                                                                                                              |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                                     |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用像 `>=2026.5.27` 這樣的 semver 下限。                                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝和更新流程會用它驗證擷取的成品。                                                                                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 當設定無效時，允許狹窄的內建外掛重新安裝復原路徑。                                                                                                                                  |
| `openclaw.install.requiredPlatformPackages`                                                | 當其 lockfile 平台限制符合目前主機時必須具現化的 npm 套件別名。                                                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 讓設定執行階段通道介面在 listen 前載入，然後將完整已設定通道外掛延遲到 listen 後啟用。                                                                                            |

Manifest 中繼資料會決定哪些提供者/通道/設定選項會在執行階段載入前出現在 onboarding 中。`package.json#openclaw.install` 會告訴 onboarding，當使用者選擇其中一個選項時，如何擷取或啟用該外掛。不要將安裝提示移入 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在非內建外掛來源的安裝和 manifest 登錄載入期間強制執行。無效值會被拒絕；較新但有效的值會讓外部外掛在較舊主機上被略過。內建來源外掛假定與主機 checkout 同版本。

`openclaw.install.requiredPlatformPackages` 適用於透過選用、平台專屬別名公開所需原生二進位檔的 npm 套件。請列出每個支援平台別名的裸 npm 套件名稱。在 npm install 期間，OpenClaw 只會驗證 lockfile 限制符合目前主機的已宣告別名。如果 npm 回報成功但省略該別名，OpenClaw 會使用全新快取重試一次；若該別名仍然缺失，則回復安裝。

`openclaw.compat.pluginApi` 會在非內建外掛來源的套件安裝期間強制執行。請用它表示該套件建置時依據的 OpenClaw 外掛 SDK/執行階段 API 下限。當外掛套件需要較新的 API，但仍保留較低的安裝提示供其他流程使用時，它可以比 `minHostVersion` 更嚴格。官方 OpenClaw 發行同步預設會將既有官方外掛 API 下限提升到 OpenClaw 發行版本，但僅外掛發行版可在套件刻意支援較舊主機時保留較低下限。請勿只使用套件版本作為相容性合約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 會使用 `openclaw.compat.pluginApi` 合約來做安裝相容性決策。

官方隨需安裝中繼資料在外掛發布於 ClawHub 時應使用 `clawhubSpec`；入門設定會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品事實。`npmSpec` 仍是尚未移至 ClawHub 的套件之相容性備援。

精確的 npm 版本釘選已位於 `npmSpec`，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確規格與 `expectedIntegrity` 配對，讓更新流程在擷取到的 npm 成品不再符合釘選發行版時以失敗關閉。互動式入門設定仍會提供受信任登錄檔的 npm 規格，包括裸套件名稱與 dist-tags，以維持相容性。目錄診斷可區分精確、浮動、完整性釘選、缺少完整性、套件名稱不符，以及無效的預設選擇來源。當 `expectedIntegrity` 存在但沒有可供其釘選的有效 npm 來源時，也會提出警告。當 `expectedIntegrity` 存在時，安裝/更新流程會強制執行它；省略時，登錄檔解析會在沒有完整性釘選的情況下被記錄。

頻道外掛在狀態、頻道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定帳號時，應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及設定安全的設定、狀態與祕密配接器；將網路用戶端、閘道監聽器和傳輸執行階段保留在主要擴充功能進入點。

執行階段進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 不能讓逸出的 `openclaw.extensions` 路徑變成可載入。

`openclaw.install.allowInvalidConfigRecovery` 是刻意狹窄的。它不會讓任意損壞的設定變成可安裝。目前它只允許安裝流程從特定過時內建外掛升級失敗中復原，例如缺少內建外掛路徑，或同一個內建外掛的過時 `channels.<id>` 項目。不相關的設定錯誤仍會阻擋安裝，並將操作人員導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是微型檢查器模組的套件中繼資料：

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

當設定、doctor、狀態或唯讀存在性流程需要在完整頻道外掛載入前進行低成本的是/否驗證探測時使用它。持久化驗證狀態不是已設定的頻道狀態：請勿使用此中繼資料自動啟用外掛、修復執行階段相依性，或決定是否應載入頻道執行階段。目標匯出應是只讀取持久化狀態的小型函式；請勿透過完整頻道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 對低成本、僅環境的已設定檢查採用相同形狀：

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

當頻道可從環境或其他微型非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的頻道執行階段，請改將該邏輯保留在外掛 `config.hasConfiguredState` hook 中。

## 探索優先順序（重複外掛 ID）

OpenClaw 會從三個根目錄探索外掛，並依此順序檢查：隨 OpenClaw 發行的內建外掛、全域安裝根目錄（`~/.openclaw/extensions`），以及目前工作區根目錄（`<workspace>/.openclaw/extensions`），外加任何明確的 `plugins.load.paths` 項目。

如果兩個探索結果共用相同 `id`，只會保留**最高優先順序**的 manifest；較低優先順序的重複項目會被捨棄，而不是並列載入。優先順序由高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **符合受追蹤安裝紀錄的全域安裝** — 透過 `openclaw plugin install`/`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤針對同一個 ID 識別出的外掛，即使該 ID 也屬於內建外掛
3. **內建** — 隨 OpenClaw 發行的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項目

影響：

- 放在工作區或全域根目錄中、未受追蹤的內建外掛分支或過時副本，不會遮蔽內建建置。
- 若要覆寫內建外掛，請針對該 ID 執行 `openclaw plugin install`，讓受追蹤的全域安裝優先於內建副本，或透過 `plugins.entries.<id>` 釘選特定路徑，讓它以設定選取優先順序勝出。
- 重複項目的捨棄會被記錄，讓 Doctor 與啟動診斷能指出被丟棄的副本。
- 設定選取的重複覆寫會在診斷中表述為明確覆寫，但仍會警告，讓過時分支和意外遮蔽保持可見。

## JSON Schema 需求

- **每個外掛都必須附帶 JSON Schema**，即使它不接受任何設定。
- 空 schema 可以接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段驗證。
- 使用新設定鍵擴充或分支內建外掛時，請同時更新該外掛的 `openclaw.plugin.json` `configSchema`。內建外掛 schema 是嚴格的，因此若在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，但未將 `myNewKey` 加入 `configSchema.properties`，會在外掛執行階段載入前被拒絕。

Schema 擴充範例：

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

- 未知的 `channels.*` 鍵是**錯誤**，除非頻道 ID 由外掛 manifest 宣告。如果相同 ID 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs`（已被參照但目前無法探索的外掛）中，OpenClaw 會將此降級為**警告**。
- `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 參照未知外掛 ID 時是**警告**（「已忽略過時設定項目」），不是錯誤，因此升級和已移除/重新命名的外掛不會阻擋閘道啟動。
- `plugins.slots.memory` 參照未知外掛 ID 時是**錯誤**，但已知的 `memory-lancedb` 官方外部外掛例外，會改為警告。
- 如果外掛已安裝但 manifest 或 schema 損壞或缺失，驗證會失敗，且 Doctor 會回報外掛錯誤。
- 如果外掛設定存在但外掛已**停用**，設定會被保留，並在 Doctor + 日誌中顯示**警告**。

完整 `plugins.*` schema 請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- manifest 對**原生 OpenClaw 外掛**是**必要**的，包括本機檔案系統載入。執行階段仍會另行載入外掛模組；manifest 僅用於探索與驗證。
- 原生 manifest 會以 JSON5 剖析，因此註解、尾隨逗號和未加引號的鍵都可接受，只要最終值仍是物件。
- manifest 載入器只會讀取已文件化的 manifest 欄位。避免自訂頂層鍵。
- 當外掛不需要時，`channels`、`providers`、`cliBackends` 和 `skills` 都可省略。
- `providerCatalogEntry` 必須保持輕量，且不應匯入寬泛的執行階段程式碼；請將它用於靜態提供者目錄中繼資料或狹窄的探索描述子，而不是請求期間執行。
- 互斥外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`（預設 `memory-core`），`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設 `legacy`）。
- 請在此 manifest 中宣告互斥外掛種類。執行階段項目的 `OpenClawPluginDefinition.kind` 已淘汰，且僅作為舊外掛的相容性備援保留。
- 環境變數中繼資料（`setup.providers[].envVars`、已淘汰的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告性。狀態、稽核、排程交付驗證及其他唯讀介面，在將環境變數視為已設定前，仍會套用外掛信任與有效啟用政策。
- 需要提供者程式碼的執行階段精靈中繼資料，請參閱[提供者執行階段 hook](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記錄建置步驟和任何套件管理器允許清單需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="rocket">
    外掛入門。
  </Card>
  <Card title="外掛架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概覽" href="/zh-TW/plugins/sdk-overview" icon="book">
    外掛 SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
