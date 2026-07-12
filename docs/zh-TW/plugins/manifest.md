---
read_when:
    - 你正在建置 OpenClaw 外掛
    - 你需要發布外掛設定結構描述，或偵錯外掛驗證錯誤
summary: 外掛資訊清單與 JSON 結構描述要求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-11T21:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

本頁說明**原生 OpenClaw 外掛資訊清單** `openclaw.plugin.json`。如需瞭解相容的套件配置（Codex、Claude、Cursor），請參閱[外掛套件](/zh-TW/plugins/bundles)。

相容的套件格式會改用各自的資訊清單檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些配置，但不會使用下方的 `openclaw.plugin.json` 結構描述來驗證它們。對於相容套件，若其配置符合 OpenClaw 的執行階段預期，OpenClaw 會讀取套件中繼資料、宣告的 Skills 根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的鉤子套件。

每個原生 OpenClaw 外掛都**必須**在**外掛根目錄**中提供 `openclaw.plugin.json`。OpenClaw 會讀取此檔案，以便在**不執行外掛程式碼**的情況下驗證設定。資訊清單缺失或無效會阻止設定驗證，並視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需瞭解原生功能模型與目前的外部相容性指南，請參閱[功能模型](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的用途

`openclaw.plugin.json` 是 OpenClaw 在**載入外掛程式碼之前**讀取的中繼資料。其中的所有內容都必須能以足夠低的成本進行檢查，無須啟動外掛執行階段。

**請將其用於：**

- 外掛識別、設定驗證與設定介面提示
- 驗證、初始設定與設置中繼資料（別名、自動啟用、供應商環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列所有權的簡寫
- 靜態功能所有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併至目錄與驗證介面的頻道專屬設定中繼資料

**請勿將其用於：**註冊執行階段行為、宣告程式碼進入點，或 npm 安裝中繼資料。這些內容應放在外掛程式碼與 `package.json` 中。

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

| 欄位                                 | 必填     | 類型                         | 意義                                                                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 正式外掛 ID。這是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                                   |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                                             |
| `requiresPlugins`                    | 否       | `string[]`                   | 此外掛要生效時也必須安裝的外掛 ID。探索機制仍會讓此外掛保持可載入狀態，但缺少任何必要外掛時會發出警告。                                                                                                                                                                    |
| `enabledByDefault`                   | 否       | `true`                       | 將隨附外掛標示為預設啟用。省略此欄位或設為任何非 `true` 值，可讓外掛維持預設停用。                                                                                                                                                                                         |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 將隨附外掛標示為僅在列出的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍具有優先權。                                                                                                                                                                               |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此正式外掛 ID 的舊版 ID。                                                                                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提及這些提供者 ID 時，應自動啟用此外掛。                                                                                                                                                                                                             |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告一或多個由 `plugins.slots.*` 使用的互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個槽位的外掛會在同一個陣列中宣告兩種種類。                                                                                                                                |
| `channels`                           | 否       | `string[]`                   | 此外掛擁有的頻道 ID。用於探索和設定驗證。                                                                                                                                                                                                                                  |
| `providers`                          | 否       | `string[]`                   | 此外掛擁有的提供者 ID。                                                                                                                                                                                                                                                    |
| `providerCatalogEntry`               | 否       | `string`                     | 相對於外掛根目錄的輕量提供者目錄模組路徑，用於受資訊清單範圍限定的提供者目錄中繼資料；無須啟動完整的外掛執行階段即可載入。                                                                                                                                                   |
| `modelSupport`                       | 否       | `object`                     | 由資訊清單擁有的模型系列簡寫中繼資料，用於在執行階段前自動載入外掛。                                                                                                                                                                                                       |
| `modelCatalog`                       | 否       | `object`                     | 此外掛所擁有提供者的宣告式模型目錄中繼資料。這是未來支援唯讀清單、初始設定、模型選擇器、別名及隱藏功能的控制平面契約，且無須載入外掛執行階段。                                                                                                                             |
| `modelPricing`                       | 否       | `object`                     | 由提供者擁有的外部定價查詢政策。使用此欄位可讓本機／自行託管的提供者選擇不使用遠端定價目錄，或將提供者參照對應至 OpenRouter/LiteLLM 目錄 ID，而無須在核心中硬編碼提供者 ID。                                                                                                    |
| `modelIdNormalization`               | 否       | `object`                     | 由提供者擁有的模型 ID 別名／前綴清理作業，必須在提供者執行階段載入前執行。                                                                                                                                                                                                 |
| `providerEndpoints`                  | 否       | `object[]`                   | 由資訊清單擁有的端點主機／`baseUrl` 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                                                                                          |
| `providerRequest`                    | 否       | `object`                     | 低成本的提供者系列及請求相容性中繼資料，由通用請求政策在提供者執行階段載入前使用。                                                                                                                                                                                         |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 提供者預設組態，讓設定或安裝介面可以提供這些選項，而無須在核心中硬編碼提供者專屬整合。                                                                                                                                                               |
| `cliBackends`                        | 否       | `string[]`                   | 此外掛擁有的命令列介面推論後端 ID。用於依明確設定參照在啟動時自動啟用。                                                                                                                                                                                                    |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 提供者或命令列介面後端參照；在執行階段載入前進行冷啟動模型探索時，應探查由其外掛擁有的合成驗證鉤子。                                                                                                                                                                       |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 由隨附外掛擁有的預留位置 API 金鑰值，代表非機密的本機、OAuth 或環境認證資料狀態。                                                                                                                                                                                          |
| `commandAliases`                     | 否       | `object[]`                   | 此外掛擁有的命令名稱，應在執行階段載入前產生可辨識外掛的設定及命令列介面診斷資訊。                                                                                                                                                                                         |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 已棄用的提供者驗證／狀態查詢相容性環境變數中繼資料。新外掛請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此欄位。                                                                                                                                        |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 僅用於用量／帳務的提供者認證資料。OpenClaw 會使用這些名稱探索用量及清除機密資訊，但絕不會將其用於推論驗證。                                                                                                                                                                 |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 應重複使用另一個提供者 ID 進行驗證查詢的提供者 ID，例如共用基礎提供者 API 金鑰和驗證設定檔的程式設計提供者。                                                                                                                                                               |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 無須載入外掛程式碼即可檢查的低成本頻道環境變數中繼資料。用於通用啟動／設定輔助程式應能看見的環境變數驅動頻道設定或驗證介面。                                                                                                                                        |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於初始設定選擇器、偏好提供者解析及簡單命令列介面旗標接線的低成本驗證選項中繼資料。                                                                                                                                                                                       |
| `activation`                         | 否       | `object`                     | 用於啟動、提供者、命令、頻道、路由及能力觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由外掛執行階段擁有。                                                                                                                                                     |
| `setup`                              | 否       | `object`                     | 探索和設定介面無須載入外掛執行階段即可檢查的低成本設定／初始設定描述項。                                                                                                                                                                                                  |
| `qaRunners`                          | 否       | `object[]`                   | 共用 `openclaw qa` 主機在外掛執行階段載入前使用的低成本品質保證執行器描述項。                                                                                                                                                                                             |
| `contracts`                          | 否       | `object`                     | 外部驗證鉤子、嵌入、語音、即時轉錄、即時語音、媒體理解、影像／影片／音樂生成、網頁擷取、網頁搜尋、工作節點提供者、文件／網頁內容擷取及工具所有權的靜態能力所有權快照。                                                                                                        |
| `configContracts`                    | 否       | `object`                     | 由資訊清單擁有並供通用核心輔助程式使用的設定行為：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑限縮。請參閱 [configContracts 參考資料](#configcontracts-reference)。                                                                                                     |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 針對 `contracts.mediaUnderstandingProviders` 中宣告的提供者 ID，提供低成本的媒體理解預設中繼資料。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.imageGenerationProviders` 中宣告的提供者 ID，提供低成本的影像生成驗證中繼資料，包括由提供者擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.videoGenerationProviders` 中宣告的提供者 ID，提供低成本的影片生成驗證中繼資料，包括由提供者擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 針對 `contracts.musicGenerationProviders` 中宣告的提供者 ID，提供低成本的音樂生成驗證中繼資料，包括由提供者擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 針對 `contracts.tools` 中宣告、由外掛擁有的工具，提供低成本的可用性中繼資料。當工具僅應在存在設定、環境變數或驗證依據時才載入執行階段，請使用此欄位。                                                                                                  |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 由資訊清單擁有的頻道設定中繼資料，在載入執行階段之前合併至探索與驗證介面。                                                                                                                                                                 |
| `skills`                             | 否       | `string[]`                   | 要載入的 Skill 目錄，相對於外掛根目錄。                                                                                                                                                                                                                    |
| `name`                               | 否       | `string`                     | 供人閱讀的外掛名稱。                                                                                                                                                                                                                                                |
| `description`                        | 否       | `string`                     | 顯示於外掛介面中的簡短摘要。                                                                                                                                                                                                                                    |
| `catalog`                            | 否       | `object`                     | 外掛目錄介面的選用呈現提示。此中繼資料不會安裝、啟用外掛，也不會授予外掛信任。                                                                                                                                               |
| `icon`                               | 否       | `string`                     | 用於市集／目錄卡片的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL；若省略此欄位或其值無效，則會改用預設的外掛圖示。                                                                                                         |
| `version`                            | 否       | `string`                     | 僅供參考的外掛版本。                                                                                                                                                                                                                                              |
| `uiHints`                            | 否       | `Record<string, object>`     | 設定欄位的 UI 標籤、預留位置文字與敏感性提示。                                                                                                                                                                                                          |

## 目錄參考

`catalog` 為外掛瀏覽器提供選用的顯示提示。主機可以忽略這些提示。它們絕不會安裝或啟用外掛，也不會變更其執行階段行為或信任等級。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| 欄位       | 類型      | 含義                                               |
| ---------- | --------- | -------------------------------------------------- |
| `featured` | `boolean` | 目錄介面是否應將此外掛列為精選項目。               |
| `order`    | `number`  | 精選外掛之間的遞增顯示順序提示；數值越低越早顯示。 |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述相符 `contracts.*GenerationProviders` 清單中所宣告提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具無須匯入每個提供者外掛，即可判斷生成提供者是否可用。

這些欄位僅用於成本低廉的宣告式事實。傳輸、請求轉換、權杖重新整理、憑證驗證及實際生成行為仍由外掛執行階段負責。

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

| 欄位                   | 必要 | 類型       | 含義                                                                                                               |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | 否   | `string[]` | 應視為此生成提供者靜態驗證別名的其他提供者 ID。                                                                   |
| `authProviders`        | 否   | `string[]` | 其已設定驗證設定檔應視為此生成提供者驗證依據的提供者 ID。                                                         |
| `configSignals`        | 否   | `object[]` | 適用於無須驗證設定檔或環境變數即可設定之本機或自行託管提供者的低成本純設定可用性訊號。                             |
| `authSignals`          | 否   | `object[]` | 明確的驗證訊號。若存在，這些訊號會取代由提供者 ID、`aliases` 和 `authProviders` 組成的預設訊號集。                 |
| `referenceAudioInputs` | 否   | `boolean`  | 僅限影片生成。提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。                     |

每個 `configSignals` 項目支援：

| 欄位             | 必要 | 類型       | 含義                                                                                                                                                             |
| ---------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是   | `string`   | 要檢查之外掛所擁有設定物件的點號路徑，例如 `plugins.entries.example.config`。                                                                                     |
| `overlayPath`    | 否   | `string`   | 根設定內的點號路徑；評估訊號前，該路徑的物件應覆蓋根物件。用於 `image`、`video` 或 `music` 等特定功能設定。                                                       |
| `overlayMapPath` | 否   | `string`   | 根設定內的點號路徑；該路徑物件中的每個值都應分別覆蓋根物件。用於 `accounts` 等具名帳號對應表，其中任何已設定的帳號都應符合資格。                                  |
| `required`       | 否   | `string[]` | 有效設定內必須具有已設定值的點號路徑。字串不得為空；物件和陣列也不得為空。                                                                                         |
| `requiredAny`    | 否   | `string[]` | 有效設定內的點號路徑，其中至少一個必須具有已設定值。                                                                                                               |
| `mode`           | 否   | `object`   | 有效設定內的選用字串模式防護條件。當純設定可用性僅適用於某一模式時使用。                                                                                           |

每個 `mode` 防護條件支援：

| 欄位         | 必要 | 類型       | 含義                                                           |
| ------------ | ---- | ---------- | -------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點號路徑。預設為 `mode`。                          |
| `default`    | 否   | `string`   | 設定省略該路徑時使用的模式值。                                 |
| `allowed`    | 否   | `string[]` | 若存在，僅當有效模式是其中一個值時，訊號才會通過。             |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式是其中一個值時，訊號會失敗。                 |

每個 `authSignals` 項目支援：

| 欄位              | 必要 | 類型     | 含義                                                                                                                                             |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                         |
| `providerBaseUrl` | 否   | `object` | 選用的防護條件，僅當所參照的已設定提供者使用允許的基礎 URL 時，才將此訊號計入。當驗證別名僅對特定 API 有效時使用。                                |

每個 `providerBaseUrl` 防護條件支援：

| 欄位              | 必要 | 類型       | 含義                                                                                                                           |
| ----------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | 是   | `string`   | 應檢查其 `baseUrl` 的提供者設定 ID。                                                                                           |
| `defaultBaseUrl`  | 否   | `string`   | 提供者設定省略 `baseUrl` 時假定使用的基礎 URL。                                                                                |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基礎 URL。當已設定或預設的基礎 URL 與這些正規化值均不相符時，會忽略此訊號。                                    |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 結構，並以工具名稱為鍵。`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 不必只為了讓工具工廠傳回 `null` 而匯入外掛執行階段。

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

除上述共用的 `configSignals`／`authSignals` 欄位外，`toolMetadata` 項目也接受 `optional`（將工具標示為啟用外掛時非必要）和 `replaySafe`（將工具執行標示為可在模型回合未完整結束後安全重複執行）。

若工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於工廠依賴驗證／設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段進行詢問。

## `providerAuthChoices` 參考

每個 `providerAuthChoices` 項目描述一個初始設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此資訊。提供者設定清單會使用這些資訊清單選項、由描述元衍生的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                                                  | 說明                                                                                                             |
| --------------------- | ---- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此選項所屬的提供者 ID。                                                                                          |
| `method`              | 是   | `string`                                                              | 要分派至的驗證方法 ID。                                                                                          |
| `choiceId`            | 是   | `string`                                                              | 新手設定與命令列介面流程所使用的穩定驗證選項 ID。                                                                |
| `choiceLabel`         | 否   | `string`                                                              | 顯示給使用者的標籤。若省略，OpenClaw 會改用 `choiceId`。                                                         |
| `choiceHint`          | 否   | `string`                                                              | 選擇器的簡短輔助文字。                                                                                           |
| `assistantPriority`   | 否   | `number`                                                              | 在由助理驅動的互動式選擇器中，數值較低者排序較前。                                                               |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 在助理選擇器中隱藏此選項，但仍允許透過命令列介面手動選取。                                                       |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 應將使用者重新導向至此替代選項的舊版選項 ID。                                                                    |
| `groupId`             | 否   | `string`                                                              | 用於將相關選項分組的選用群組 ID。                                                                                |
| `groupLabel`          | 否   | `string`                                                              | 該群組顯示給使用者的標籤。                                                                                       |
| `groupHint`           | 否   | `string`                                                              | 群組的簡短輔助文字。                                                                                             |
| `onboardingFeatured`  | 否   | `boolean`                                                             | 在互動式新手設定選擇器中，於「更多……」項目之前，將此群組顯示在精選層級。                                         |
| `optionKey`           | 否   | `string`                                                              | 簡單單一旗標驗證流程的內部選項鍵。                                                                               |
| `cliFlag`             | 否   | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                                |
| `cliOption`           | 否   | `string`                                                              | 完整的命令列介面選項格式，例如 `--openrouter-api-key <key>`。                                                    |
| `cliDescription`      | 否   | `string`                                                              | 命令列介面說明中使用的描述。                                                                                     |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應顯示於哪些新手設定介面中。若省略，預設為 `["text-inference"]`。                                           |

## `commandAliases` 參考

當外掛擁有某個執行階段命令名稱，而使用者可能誤將其放入 `plugins.allow`，或嘗試將其作為根命令列介面命令執行時，請使用 `commandAliases`。OpenClaw 會使用此中繼資料進行診斷，而無須匯入外掛執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 說明                                                                           |
| ------------ | ---- | ----------------- | ------------------------------------------------------------------------------ |
| `name`       | 是   | `string`          | 屬於此外掛的命令名稱。                                                         |
| `kind`       | 否   | `"runtime-slash"` | 將此別名標記為聊天斜線命令，而非根命令列介面命令。                             |
| `cliCommand` | 否   | `string`          | 若有相關的根命令列介面命令，則為命令列介面操作建議該命令。                     |

## `activation` 參考

當外掛能以低成本宣告哪些控制平面事件應將其納入啟用／載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，而非生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證外掛程式碼已執行。啟用規劃器會使用這些欄位縮小候選外掛範圍，之後才退回使用既有的資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與掛鉤。

優先使用已能描述擁有權的最精確中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述元或 `contracts` 能表達該關係時，請使用這些欄位。對於無法以這些擁有權欄位表示的額外規劃器提示，請使用 `activation`。對於 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅用於尚無擁有權欄位的嵌入式代理程式執行框架 ID。

每個外掛都應明確設定 `activation.onStartup`。只有在外掛必須於閘道啟動期間執行時，才將其設為 `true`。當外掛在啟動時不執行任何動作，且只應由更精確的觸發條件載入時，請設為 `false`。省略 `onStartup` 不再會隱含地於啟動時載入外掛；對於啟動、頻道、設定、代理程式執行框架、記憶體或其他更精確的啟用觸發條件，請使用明確的啟用中繼資料。

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

| 欄位               | 必填 | 類型                                                 | 說明                                                                                                                                                                                   |
| ------------------ | ---- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的閘道啟動啟用設定。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 則會維持啟動延遲載入，除非其他相符的觸發條件要求載入。                                              |
| `onProviders`      | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的提供者 ID。                                                                                                                                              |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的嵌入式代理程式執行框架執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                                                           |
| `onCommands`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的命令 ID。                                                                                                                                                |
| `onChannels`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的頻道 ID。                                                                                                                                                |
| `onRoutes`         | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的路由種類。                                                                                                                                               |
| `onConfigPaths`    | 否   | `string[]`                                           | 當以根目錄為基準的設定路徑存在且未明確停用時，應將此外掛納入啟動／載入計畫的路徑。                                                                                                     |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃所使用的廣泛能力提示。可行時，應優先使用更精確的欄位。                                                                                                                 |

目前的實際使用端：

- 閘道啟動規劃使用 `activation.onStartup` 明確指定啟動時匯入。
- 由命令觸發的命令列介面規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理程式執行階段啟動規劃對嵌入式執行框架使用 `activation.onAgentHarnesses`，對命令列介面執行階段別名使用頂層 `cliBackends[]`。
- 當缺少明確的頻道啟用中繼資料時，由頻道觸發的設定／頻道規劃會退回使用舊版 `channels[]` 擁有權。
- 啟動外掛規劃對非頻道的根設定介面使用 `activation.onConfigPaths`，例如內建瀏覽器外掛的 `browser` 區塊。
- 當缺少明確的提供者啟用中繼資料時，由提供者觸發的設定／執行階段規劃會退回使用舊版 `providers[]` 與頂層 `cliBackends[]` 擁有權。

規劃器診斷可區分明確的啟用提示與資訊清單擁有權的退回機制。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 則表示規劃器改用 `commandAliases` 擁有權。這些原因標籤用於主機診斷與測試；外掛作者應持續宣告最能描述擁有權的中繼資料。

## `qaRunners` 參考

當外掛在共用的 `openclaw qa` 根命令下提供一個或多個傳輸執行器時，請使用 `qaRunners`。請讓此中繼資料保持輕量且靜態；外掛執行階段仍透過輕量的 `runtime-api.ts` 介面負責實際的命令列介面註冊，該介面會匯出相符的 `qaRunnerCliRegistrations`。選用的 `adapterFactory` 可將傳輸方式公開給共用的品質保證情境，而不變更已註冊命令的執行器。

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

| 欄位          | 必填 | 類型     | 說明                                                                 |
| ------------- | ---- | -------- | -------------------------------------------------------------------- |
| `commandName` | 是   | `string` | 掛載於 `openclaw qa` 下的子命令，例如 `matrix`。                     |
| `description` | 否   | `string` | 共用主機需要預留命令時所使用的備用說明文字。                         |

`adapterFactory` 識別碼必須與 `commandName` 相符。請勿匯出資訊清單中不存在之命令的註冊項目。

## setup 參考

當設定與初始引導介面需要在載入執行階段前取得成本低廉、由外掛擁有的中繼資料時，請使用 `setup`。

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

頂層的 `cliBackends` 仍然有效，並繼續描述命令列介面的推論後端。`setup.cliBackends` 是控制平面／設定流程專用的設定描述項介面，這些流程應僅使用中繼資料。

若存在 `setup.providers` 與 `setup.cliBackends`，它們會是設定探索時優先採用、以描述項為先的查詢介面。如果描述項只能縮小候選外掛的範圍，而設定仍需要更豐富的設定期間執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 也會將 `setup.providers[].envVars` 納入通用的供應商驗證與環境變數查詢。在棄用過渡期內，仍可透過相容性轉接器支援 `providerAuthEnvVars`，但仍使用它的非內建外掛會收到資訊清單診斷。新外掛應將設定／狀態環境中繼資料放在 `setup.providers[].envVars`。

當計費或組織層級的憑證必須啟用 `resolveUsageAuth`，但不應成為推論憑證時，請使用 `providerUsageAuthEnvVars`。這些名稱會加入工作區 dotenv 封鎖、ACP 子行程移除、沙箱機密篩選，以及廣泛的機密清除。供應商執行階段仍會在 `resolveUsageAuth` 內讀取值並加以分類。

當沒有設定進入點，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也能從 `setup.providers[].authMethods` 衍生簡單的設定選項。若需要自訂標籤、命令列介面旗標、初始引導範圍及助理中繼資料，仍應優先使用明確的 `providerAuthChoices` 項目。

只有當這些描述項足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅使用描述項的契約，且不會為設定查詢執行 `setup-api` 或 `openclaw.setupEntry`。如果僅使用描述項的外掛仍附帶上述任一設定執行階段進入點，OpenClaw 會回報附加診斷，並繼續忽略該進入點。省略 `requiresRuntime` 會保留舊版備援行為，因此已新增描述項但未加入此旗標的現有外掛不會中斷。

由於設定查詢可能執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 與 `setup.cliBackends[]` 值在所有已探索的外掛中都必須保持唯一。若擁有權不明確，系統會採取封閉式失敗，而不是依探索順序選出其中一個。

執行設定執行階段時，若 `setup-api` 註冊的供應商或命令列介面後端未在資訊清單描述項中宣告，或描述項沒有對應的執行階段註冊，設定登錄診斷會回報描述項偏差。這些診斷屬於附加資訊，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位           | 必要 | 類型       | 意義                                                                                         |
| -------------- | ---- | ---------- | -------------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | 在設定或初始引導期間公開的供應商識別碼。正規化後的識別碼須在全域保持唯一。                   |
| `authMethods`  | 否   | `string[]` | 此供應商無須載入完整執行階段即可支援的設定／驗證方法識別碼。                                |
| `envVars`      | 否   | `string[]` | 通用設定／狀態介面可在外掛執行階段載入前檢查的環境變數。                                   |
| `authEvidence` | 否   | `object[]` | 針對可透過非機密標記進行驗證之供應商的低成本本機驗證證據檢查。                             |

`authEvidence` 用於由供應商擁有、可在不載入執行階段程式碼的情況下驗證的本機憑證標記。這些檢查必須維持低成本且僅在本機執行：不得進行網路呼叫、不得讀取鑰匙圈或機密管理員、不得執行殼層命令，也不得探查供應商 API。

支援的證據項目：

| 欄位               | 必要 | 類型       | 意義                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                            |
| `fileEnvVar`       | 否   | `string`   | 包含明確憑證檔案路徑的環境變數。                                                                          |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時所檢查的本機憑證檔案路徑。支援 `${HOME}` 與 `${APPDATA}`。                  |
| `requiresAnyEnv`   | 否   | `string[]` | 證據生效前，所列環境變數中至少一個必須為非空值。                                                          |
| `requiresAllEnv`   | 否   | `string[]` | 證據生效前，所列每個環境變數都必須為非空值。                                                              |
| `credentialMarker` | 是   | `string`   | 證據存在時傳回的非機密標記。                                                                              |
| `source`           | 否   | `string`   | 用於驗證／狀態輸出的使用者可見來源標籤。                                                                  |

### setup 欄位

| 欄位               | 必要 | 類型       | 意義                                                                                          |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在設定與初始引導期間公開的供應商設定描述項。                                                  |
| `cliBackends`      | 否   | `string[]` | 用於以描述項為先之設定查詢的設定期間後端識別碼。正規化後的識別碼須在全域保持唯一。            |
| `configMigrations` | 否   | `string[]` | 由此外掛設定介面擁有的設定遷移識別碼。                                                        |
| `requiresRuntime`  | 否   | `boolean`  | 在描述項查詢後，設定是否仍需要執行 `setup-api`。                                              |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應至簡短轉譯提示的映射。索引鍵可以使用句點表示巢狀設定欄位，但任何路徑區段都不可為 `__proto__`、`constructor` 或 `prototype`；設定程序會拒絕這些名稱。

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

每個欄位提示可包含：

| 欄位          | 類型       | 意義                         |
| ------------- | ---------- | ---------------------------- |
| `label`       | `string`   | 使用者可見的欄位標籤。       |
| `help`        | `string`   | 簡短的輔助文字。             |
| `tags`        | `string[]` | 選用的使用者介面標籤。       |
| `advanced`    | `boolean`  | 將欄位標示為進階欄位。       |
| `sensitive`   | `boolean`  | 將欄位標示為機密或敏感欄位。 |
| `placeholder` | `string`   | 表單輸入的預留位置文字。     |

## contracts 參考

只有在 OpenClaw 可於不匯入外掛執行階段的情況下讀取靜態能力擁有權中繼資料時，才使用 `contracts`。

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
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每個清單皆為選用：

| 欄位                             | 類型       | 含義                                                                                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 擴充功能工廠識別碼，目前為 `codex-app-server`。                                                                     |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果中介軟體的執行階段識別碼。                                                                                   |
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任工具執行前政策識別碼。隨附外掛無須此欄位即可註冊政策。                                               |
| `externalAuthProviders`          | `string[]` | 此外掛擁有其外部驗證設定檔掛鉤的供應商識別碼。                                                                                       |
| `embeddingProviders`             | `string[]` | 此外掛擁有的一般嵌入供應商識別碼，用於可重複使用的向量嵌入用途，包括記憶。                                                           |
| `speechProviders`                | `string[]` | 此外掛擁有的語音供應商識別碼。                                                                                                      |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄供應商識別碼。                                                                                                  |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音供應商識別碼。                                                                                                  |
| `memoryEmbeddingProviders`       | `string[]` | 此外掛擁有的已棄用記憶專用嵌入供應商識別碼。                                                                                        |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解供應商識別碼。                                                                                                  |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源供應商識別碼。                                                                                                |
| `documentExtractors`             | `string[]` | 此外掛擁有的文件（例如 PDF）擷取器供應商識別碼。                                                                                     |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的影像生成供應商識別碼。                                                                                                  |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成供應商識別碼。                                                                                                  |
| `musicGenerationProviders`       | `string[]` | 此外掛擁有的音樂生成供應商識別碼。                                                                                                  |
| `webContentExtractors`           | `string[]` | 此外掛擁有的網頁內容擷取供應商識別碼。                                                                                              |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取供應商識別碼。                                                                                                  |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋供應商識別碼。                                                                                                  |
| `workerProviders`                | `string[]` | 此外掛擁有的雲端工作節點供應商識別碼，用於佈建及由設定檔支援的租約生命週期。                                                         |
| `usageProviders`                 | `string[]` | 此外掛擁有其用量驗證與用量快照掛鉤的供應商識別碼。                                                                                  |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 擁有的匯入供應商識別碼。                                                                                 |
| `gatewayMethodDispatch`          | `string[]` | 為經驗證的外掛 HTTP 路由保留的權限，用於在程序內分派閘道方法。                                                                       |
| `tools`                          | `string[]` | 此外掛擁有的代理程式工具名稱。                                                                                                      |

`contracts.embeddedExtensionFactories` 保留給隨附且僅限 Codex app-server 的擴充功能工廠。隨附的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並透過 `api.registerAgentToolResultMiddleware(...)` 註冊。已安裝外掛僅能在明確啟用時使用相同的中介軟體介面，且只能用於其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段。

需要主機受信任工具執行前政策層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機識別碼，並且明確啟用。隨附外掛會保留現有的受信任政策路徑，但具有未宣告政策識別碼的已安裝外掛會在註冊前遭到拒絕。政策識別碼的作用域限於註冊該政策的外掛，因此兩個外掛都可以宣告並註冊 `workflow-budget`；但單一外掛不得重複註冊相同的本機識別碼。

執行階段的 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，僅載入可能擁有所要求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的供應商外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證掛鉤會被忽略。

同時實作 `resolveUsageAuth` 與 `fetchUsageSnapshot` 的供應商外掛，應在 `contracts.usageProviders` 中宣告每個自動探索到的供應商識別碼。用量探索會在載入執行階段程式碼前讀取此合約，接著僅載入已宣告的擁有者，並在載入後驗證兩個掛鉤。

一般嵌入供應商應為每個透過 `api.registerEmbeddingProvider(...)` 註冊的配接器宣告 `contracts.embeddingProviders`。可重複使用的向量生成應使用一般合約，包括記憶搜尋所使用的供應商。`contracts.memoryEmbeddingProviders` 是已棄用的記憶專用相容性機制，僅在現有供應商遷移至通用嵌入供應商介面期間保留。

工作節點供應商必須在 `contracts.workerProviders` 中宣告每個 `api.registerWorkerProvider(...)` 識別碼。核心會在呼叫 `provision` 前持久保存長期意圖；供應商會在進行外部配置前驗證其設定，而使用相同操作識別碼的重複呼叫必須採用相同租約。核心也會持久保存該已驗證的設定快照，並將其連同 `leaseId` 傳給 `inspect({ leaseId, profile })` 和 `destroy({ leaseId, profile })`，包括在具名設定檔已變更或移除後。銷毀操作具有等冪性，檢查會傳回封閉的 `active` / `destroyed` / `unknown` 狀態聯集，而 SSH 私密金鑰資料只能透過 `SecretRef` 參照。已佈建的 SSH 端點也必須包含來自受信任佈建輸出的公開 `hostKey`，且格式必須恰為 `algorithm base64`，不得包含主機名稱或註解，以便核心在連線前固定主機金鑰。產生動態身分參照的供應商可實作具權威性的 `resolveSshIdentity({ leaseId, profile, keyRef })`；未實作此功能的供應商則使用核心的通用機密解析器。具權威性的 `unknown` 會使使用中的本機記錄成為孤立記錄；在持久保存的銷毀要求之後，它則用於確認拆除完成。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。它是針對刻意在程序內分派閘道控制平面方法之原生外掛 HTTP 路由的 API 衛生控管，而非用來防範惡意原生外掛的沙箱。請僅將其用於已經要求閘道 HTTP 驗證，且經過嚴格審查的隨附或操作員介面。當閘道的根工作准入已關閉時，具備權限的路由只有在同時宣告 `auth: "gateway"` 以及路由專屬的 `gatewayRuntimeScopeSurface: "trusted-operator"` 時，才仍可存取；同一外掛的一般同層路由仍會受到准入邊界限制。這可讓暫停狀態與恢復功能保持可用，而不會授予整個外掛略過准入的權限。應在分派之外限制解析與回應成形的範圍；實質性或會變更狀態的工作必須透過閘道方法分派進行，由其負責准入與作用域強制執行。

## `configContracts` 參考

對於由資訊清單擁有、且通用核心輔助程式需要在不匯入外掛執行階段的情況下使用的設定行為，請使用 `configContracts`：危險旗標偵測、`SecretRef` 遷移目標，以及舊版設定路徑的縮限。

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

| 欄位                          | 必要 | 類型       | 含義                                                                                                                                                                                                                                   |
| ----------------------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否   | `string[]` | 表示此外掛的設定階段相容性遷移可能適用的根目錄相對設定路徑。當設定完全未參照此外掛時，可讓通用執行階段設定讀取略過所有外掛設定介面。                                                                                                     |
| `compatibilityRuntimePaths`   | 否   | `string[]` | 在外掛程式碼完全啟用前，此外掛可於執行階段處理的根目錄相對相容性路徑。這適用於應縮小隨附候選集合、又不應匯入每個相容外掛執行階段的舊版介面。                                                                                               |
| `dangerousFlags`              | 否   | `object[]` | 啟用時，`openclaw doctor` 應標示為不安全或危險的設定常值。請參閱下文。                                                                                                                                                                  |
| `secretInputs`                | 否   | `object`   | 位於 `plugins.entries.<id>.config` 下的設定路徑，`SecretRef` 遷移／稽核目標登錄檔應將其視為機密形式的字串。請參閱下文。                                                                                                                  |

每個 `dangerousFlags` 項目支援：

| 欄位     | 必要 | 類型                                  | 含義                                                                                                            |
| -------- | ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `path`   | 是   | `string`                              | 相對於 `plugins.entries.<id>.config`、以點分隔的設定路徑。支援對映／陣列區段的 `*` 萬用字元。                  |
| `equals` | 是   | `string \| number \| boolean \| null` | 將此設定值標示為危險的精確常值。                                                                                |

`secretInputs` 支援：

| 欄位                    | 必填 | 類型       | 含義                                                                                                                                                                                                                  |
| ----------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否   | `boolean`  | 決定此 SecretRef 介面是否啟用時，覆寫隨附外掛的預設啟用狀態。外掛隨附於套件中，但此介面在設定中明確啟用前應保持停用時，請使用此欄位。                                                                                  |
| `paths`                 | 是   | `object[]` | 密鑰形式的設定路徑，每個項目包含 `path`（以點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元）以及可選的 `expected`（目前僅支援 `"string"`）。                                                          |

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證備援優先順序，或通用核心輔助程式需要在執行階段載入前得知的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

| 欄位                   | 類型                                                             | 含義                                                                                                 |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此提供者公開的媒體功能。                                                                             |
| `defaultModels`        | `Record<string, string>`                                         | 設定未指定模型時使用的功能至模型預設對應。                                                           |
| `autoPriority`         | `Record<string, number>`                                         | 依憑證自動備援提供者時，數字較小者排序在前。                                                         |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 提供者支援的原生文件輸入。                                                                           |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 依文件類型設定的模型覆寫。將 `image: false` 設為停用該文件類型以影像為基礎的擷取。                    |

## channelConfigs 參考

當頻道外掛需要在執行階段載入前取得低成本的設定中繼資料時，請使用 `channelConfigs`。當沒有設定項目可用，或 `setup.requiresRuntime: false` 宣告設定不需要執行階段時，唯讀的頻道設定／狀態探索可以直接針對已設定的外部頻道使用此中繼資料。

`channelConfigs` 是外掛資訊清單的中繼資料，而不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定頻道執行個體。OpenClaw 會讀取資訊清單中繼資料，以便在外掛執行階段程式碼執行前，判斷哪個外掛擁有已設定的頻道。

對於頻道外掛，`configSchema` 和 `channelConfigs` 描述不同的路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非隨附外掛也應宣告相符的 `channelConfigs` 項目。若未宣告，OpenClaw 仍可載入外掛，但冷路徑設定結構描述、設定流程及 Control UI 介面在外掛執行階段執行前，無法得知該頻道所擁有的選項結構。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可為頻道執行階段載入前執行的命令設定檢查，宣告靜態 `auto` 預設值。隨附頻道也可以透過 `package.json#openclaw.channel.commands` 發布相同的預設值，與其他由套件擁有的頻道目錄中繼資料並列。

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

每個頻道項目可包含：

| 欄位          | 類型                     | 含義                                                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的頻道設定項目都必須提供。                       |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的可選 UI 標籤、預留文字及敏感資料提示。                                     |
| `label`       | `string`                 | 執行階段中繼資料尚未就緒時，合併至選擇器與檢查介面的頻道標籤。                             |
| `description` | `string`                 | 用於檢查與目錄介面的簡短頻道說明。                                                         |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。                             |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於其上的舊版或較低優先順序外掛 ID。                               |

### 取代另一個頻道外掛

當另一個外掛也能提供某個頻道 ID，而您的外掛是該頻道的首選擁有者時，請使用 `preferOver`。常見情況包括重新命名的外掛 ID、取代隨附外掛的獨立外掛，或為了設定相容性而保留相同頻道 ID 的受維護分支。

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

設定 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 與首選外掛 ID。若較低優先順序的外掛僅因其為隨附外掛或預設啟用而獲選，OpenClaw 會在有效的執行階段設定中停用該外掛，讓單一外掛擁有該頻道及其工具。明確的使用者選擇仍具有最高優先權：若使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇，並回報重複的頻道／工具診斷，而不會默默變更所要求的外掛集合。

請將 `preferOver` 限定於確實能提供相同頻道的外掛 ID。它不是一般用途的優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在外掛執行階段載入前，從 `gpt-5.6-sol` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷您的提供者外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 採用以下優先順序：

- 明確的 `provider/model` 參照使用其擁有者的 `providers` 資訊清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 若一個非隨附外掛與一個隨附外掛皆符合，則非隨附外掛優先
- 在使用者或設定指定提供者前，其餘歧義會被忽略

欄位：

| 欄位            | 類型       | 含義                                                                   |
| --------------- | ---------- | ---------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 比對簡寫模型 ID 的前綴。                             |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，用來比對簡寫模型 ID 的正規表示式來源。               |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯，該函式會拒絕包含巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被默默略過，處理方式與語法無效的正規表示式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考

當 OpenClaw 應在載入外掛執行階段前得知提供者模型中繼資料時，請使用 `modelCatalog`。這是由資訊清單擁有的固定目錄列、提供者別名、抑制規則及探索模式來源。執行階段重新整理仍由提供者執行階段程式碼負責，但資訊清單會告知核心何時需要執行階段。

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

| 欄位             | 類型                                                     | 含義                                                                                                      |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此外掛所擁有之供應商 ID 的目錄資料列。鍵也應出現在頂層 `providers` 中。                                   |
| `aliases`        | `Record<string, object>`                                 | 在目錄或抑制規劃中，應解析為此外掛所擁有供應商的供應商別名。                                              |
| `suppressions`   | `object[]`                                               | 來自其他來源、此外掛基於供應商特定原因予以抑制的模型資料列。                                              |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 供應商目錄可從資訊清單中繼資料讀取、重新整理至快取，或必須在執行階段取得。                                |
| `runtimeAugment` | `boolean`                                                | 僅當供應商執行階段必須在資訊清單／設定規劃後附加目錄資料列時，才設為 `true`。                             |

`aliases` 會參與模型目錄規劃的供應商擁有權查找。別名目標必須是由同一外掛擁有的頂層供應商。使用別名的供應商篩選清單中，OpenClaw 無須載入供應商執行階段，即可讀取擁有該供應商的資訊清單，並套用別名的 API／基礎 URL 覆寫。別名不會展開未篩選的目錄清單；廣泛清單只會輸出擁有該供應商的標準供應商資料列。

`suppressions` 取代舊有的供應商執行階段 `suppressBuiltInModel` 鉤子。僅當供應商由此外掛擁有，或宣告為 `modelCatalog.aliases` 中指向所擁有供應商的鍵時，才會採用抑制項目。模型解析期間不再呼叫執行階段抑制鉤子。

供應商欄位：

| 欄位                  | 類型                     | 含義                                                                                                                                                                                                                 |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | 此供應商目錄中模型的選用預設基礎 URL。                                                                                                                                                                               |
| `api`                 | `ModelApi`               | 此供應商目錄中模型的選用預設 API 配接器。                                                                                                                                                                            |
| `headers`             | `Record<string, string>` | 套用至此供應商目錄的選用靜態標頭。                                                                                                                                                                                   |
| `defaultUtilityModel` | `string`                 | 供應商針對簡短內部輔助工作（標題、進度敘述）建議的選用小型模型 ID。當未設定 `agents.defaults.utilityModel`，且此供應商提供代理程式的主要模型時使用。                                                                    |
| `models`              | `object[]`               | 必要的模型資料列。缺少 `id` 的資料列會被忽略。                                                                                                                                                                       |

模型欄位：

| 欄位               | 類型                                                           | 含義                                                                      |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 供應商本機模型 ID，不含 `provider/` 前綴。                                |
| `name`             | `string`                                                       | 選用的顯示名稱。                                                          |
| `api`              | `ModelApi`                                                     | 選用的各模型 API 覆寫。                                                   |
| `baseUrl`          | `string`                                                       | 選用的各模型基礎 URL 覆寫。                                               |
| `headers`          | `Record<string, string>`                                       | 選用的各模型靜態標頭。                                                    |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被靜默捨棄。                                      |
| `reasoning`        | `boolean`                                                      | 模型是否提供推理行為。                                                    |
| `contextWindow`    | `number`                                                       | 供應商原生的上下文視窗。                                                  |
| `contextTokens`    | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段上下文上限。                 |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出權杖數。                                                  |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的各思考層級模型 ID 或參數覆寫。                                      |
| `cost`             | `object`                                                       | 選用的每百萬權杖美元定價，包括選用的 `tieredPricing`。                    |
| `compat`           | `object`                                                       | 與 OpenClaw 模型設定相容性相符的選用相容性旗標。                          |
| `mediaInput`       | `object`                                                       | 選用的各模態輸入設定，目前僅支援影像。                                    |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 清單狀態。僅當資料列完全不應出現時才予以抑制。                            |
| `statusReason`     | `string`                                                       | 非可用狀態時顯示的選用原因。                                              |
| `replaces`         | `string[]`                                                     | 此模型所取代的舊版供應商本機模型 ID。                                     |
| `replacedBy`       | `string`                                                       | 已棄用資料列的替代供應商本機模型 ID。                                     |
| `tags`             | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                            |

抑制欄位：

| 欄位                       | 類型       | 含義                                                                                                  |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制之上游資料列的供應商 ID。必須由此外掛擁有，或宣告為所擁有的別名。                               |
| `model`                    | `string`   | 要抑制的供應商本機模型 ID。                                                                           |
| `reason`                   | `string`   | 直接要求遭抑制資料列時顯示的選用訊息。                                                                |
| `when.baseUrlHosts`        | `string[]` | 套用抑制前所需的選用有效供應商基礎 URL 主機清單。                                                     |
| `when.providerConfigApiIn` | `string[]` | 套用抑制前所需的選用精確供應商設定 `api` 值清單。                                                     |

請勿將僅限執行階段的資料放入 `modelCatalog`。只有當資訊清單資料列足夠完整，使供應商篩選清單與選擇器介面可略過登錄／執行階段探索時，才使用 `static`。當資訊清單資料列可作為有用且可列出的種子或補充資料，但之後可透過重新整理／快取加入更多資料列時，使用 `refreshable`；可重新整理的資料列本身並非權威來源。當 OpenClaw 必須載入供應商執行階段才能得知清單時，使用 `runtime`。

## modelIdNormalization 參考

針對必須在供應商執行階段載入前進行的低成本、供應商自有模型 ID 清理，使用 `modelIdNormalization`。這可將簡短模型名稱、供應商本機舊版 ID 和代理前綴規則等別名保留在擁有它們的外掛資訊清單中，而不是放在核心模型選擇表內。

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

供應商欄位：

| 欄位                                 | 類型                    | 含義                                                                                       |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依原樣回傳。                                           |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版供應商／模型重複情形。                                   |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時加入的前綴。                                            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。                       |

## providerEndpoints 參考

對於通用要求原則必須在供應商執行階段載入前得知的端點分類，使用 `providerEndpoints`。核心仍負責定義各個 `endpointClass` 的含義；外掛資訊清單則負責主機與基礎 URL 中繼資料。

正式外部化的供應商外掛不包含在核心發行版本中，因此在安裝前無法看到其資訊清單。其 `providerEndpoints` 也必須鏡像至 `scripts/lib/official-external-provider-catalog.json`，如此即使沒有該外掛，端點分類仍可運作；合約測試會強制確保兩者一致。

端點欄位：

| 欄位                           | 類型       | 含義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                  |
| `hosts`                        | `string[]` | 對應至該端點類別的確切主機名稱。                                                              |
| `hostSuffixes`                 | `string[]` | 對應至該端點類別的主機後綴。以 `.` 開頭表示僅比對網域後綴。                                  |
| `baseUrls`                     | `string[]` | 對應至該端點類別且已正規化的確切 HTTP(S) 基底 URL。                                           |
| `googleVertexRegion`           | `string`   | 確切全域主機所使用的靜態 Google Vertex 區域。                                                 |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的後綴，用於取出 Google Vertex 區域前綴。                                       |

## providerRequest 參考

當通用請求政策需要低成本的請求相容性中繼資料，且不應載入供應商執行階段時，請使用 `providerRequest`。特定行為的承載資料重寫應保留在供應商執行階段鉤子或共用供應商系列輔助工具中。

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

供應商欄位：

| 欄位                  | 類型         | 含義                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用請求相容性判斷與診斷所使用的供應商系列標籤。                                       |
| `compatibilityFamily` | `"moonshot"` | 共用請求輔助工具可選用的供應商系列相容性分類。                                         |
| `openAICompletions`   | `object`     | OpenAI 相容的補全請求旗標，目前為 `supportsStreamingUsage`。                           |

## secretProviderIntegrations 參考

當外掛可發布可重複使用的 SecretRef exec 供應商預設時，請使用 `secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料，將外掛擁有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際的密鑰解析交由 SecretRef 執行階段處理。只有內建外掛，以及從受管理之外掛安裝根目錄中發現的已安裝外掛（例如透過 git 和 ClawHub 安裝者），才會公開這些預設。

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

映射鍵是整合識別碼。若省略 `providerAlias`，OpenClaw 會使用整合識別碼作為 SecretRef 供應商別名。供應商別名必須符合一般 SecretRef 供應商別名模式，例如 `team-secrets` 或 `onepassword-work`。

當操作人員選取此預設時，OpenClaw 會寫入如下的供應商參照：

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

啟動或重新載入時，OpenClaw 會載入目前的外掛資訊清單中繼資料、檢查擁有該供應商的外掛是否已安裝且處於啟用狀態，並依資訊清單具體化 exec 命令，以解析該供應商。停用或移除外掛會撤銷作用中 SecretRef 的該供應商。需要獨立 exec 設定的操作人員仍可直接手動撰寫包含 `command`/`args` 的供應商設定。

目前僅支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]` 必須是以 `./` 開頭、相對於外掛根目錄的解析器指令碼。OpenClaw 會在啟動或重新載入時，將其具體化為目前的 Node 執行檔及外掛內指令碼的絕對路徑。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 選項不屬於資訊清單預設契約。需要非 Node 命令的操作人員可以直接設定獨立的手動 exec 供應商。

OpenClaw 會從外掛根目錄推導資訊清單預設的 `trustedDirs`；對於 `${node}` 預設，也會包含目前 Node 執行檔所在目錄。資訊清單中撰寫的 `trustedDirs` 會被忽略。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath` 等其他 exec 供應商選項，會直接傳遞至一般 SecretRef exec 供應商設定。

## modelPricing 參考

當供應商需要在執行階段載入前控制控制平面的定價行為時，請使用 `modelPricing`。閘道定價快取會讀取此中繼資料，而不匯入供應商執行階段程式碼。

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

供應商欄位：

| 欄位         | 類型              | 含義                                                                                               |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對永不應擷取 OpenRouter 或 LiteLLM 定價的本機／自行託管供應商設為 `false`。                        |
| `openRouter` | `false \| object` | OpenRouter 定價查詢映射。`false` 會停用此供應商的 OpenRouter 查詢。                                |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢映射。`false` 會停用此供應商的 LiteLLM 查詢。                                     |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                                   |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄供應商識別碼與 OpenClaw 供應商識別碼不同時使用，例如 `zai` 供應商對應的 `z-ai`。                            |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型識別碼視為巢狀的供應商／模型參照，適用於 OpenRouter 等代理供應商。                                    |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型識別碼變體。`version-dots` 會嘗試使用如 `claude-opus-4.6` 的點號版本識別碼。                       |

### OpenClaw 供應商索引

OpenClaw 供應商索引是由 OpenClaw 維護的預覽中繼資料，適用於外掛可能尚未安裝的供應商。它不是外掛資訊清單的一部分。外掛資訊清單仍是已安裝外掛的權威來源。供應商索引是內部後備契約；當供應商外掛尚未安裝時，未來可安裝供應商及安裝前模型選擇器介面將使用此契約。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛資訊清單的 `modelCatalog`。
3. 明確重新整理所產生的模型目錄快取。
4. OpenClaw 供應商索引預覽列。

供應商索引不得包含密鑰、啟用狀態、執行階段鉤子或即時帳戶專屬模型資料。其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 供應商列結構，但應僅限於穩定的顯示中繼資料；除非有意讓 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位與已安裝外掛資訊清單保持一致。具有即時 `/models` 探索功能的供應商，應透過明確的模型目錄快取路徑寫入重新整理後的資料列，而不是在一般列出或上線設定期間呼叫供應商 API。

對於外掛已移出核心或尚未安裝的供應商，供應商索引項目也可包含可安裝外掛的中繼資料。此中繼資料仿照頻道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及低成本的驗證選項標籤，足以顯示可安裝的設定選項。外掛安裝完成後，會以其資訊清單為準，並忽略該供應商的供應商索引項目。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層資訊清單能力鍵遷移至 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些鍵（或任何其他能力清單）都不再以頂層資訊清單欄位形式讀取；一般資訊清單載入只會辨識 `contracts` 下的這些欄位。

## 資訊清單與 package.json 的比較

這兩個檔案各有不同用途：

| 檔案                   | 用途                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選項中繼資料，以及必須在外掛程式碼執行前存在的介面提示                                                       |
| `package.json`         | npm 中繼資料、相依套件安裝，以及用於進入點、安裝管控、設定或目錄中繼資料的 `openclaw` 區塊                                      |

如果不確定某項中繼資料應放在哪裡，請使用以下規則：

- 如果 OpenClaw 必須在載入外掛程式碼前得知該資訊，請將其放入 `openclaw.plugin.json`
- 如果該資訊與封裝、進入檔案或 npm 安裝行為有關，請將其放入 `package.json`

### 影響探索的 package.json 欄位

部分執行階段前的外掛中繼資料會刻意放在 `package.json` 的 `openclaw` 區塊下，而不是 `openclaw.plugin.json` 中。`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw 外掛契約；原生外掛必須使用 `openclaw.plugin.json`，以及下方支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 含義                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須位於外掛套件目錄內。                                                                                                                                     |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件建置後的 JavaScript 執行階段進入點。必須位於外掛套件目錄內。                                                                                                        |
| `openclaw.setupEntry`                                                                      | 輕量的僅限設定進入點，用於初始設定、延後啟動頻道，以及唯讀的頻道狀態／SecretRef 探索。必須位於外掛套件目錄內。                                                                    |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件建置後的 JavaScript 設定進入點。需要 `setupEntry`、必須存在，且必須位於外掛套件目錄內。                                                                             |
| `openclaw.channel`                                                                         | 輕量的頻道目錄中繼資料，例如標籤、文件路徑、別名和選項文案。                                                                                                                     |
| `openclaw.channel.commands`                                                                | 在頻道執行階段載入前，供設定、稽核及命令清單介面使用的靜態原生命令與原生 skill 自動預設中繼資料。                                                                                 |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已存在僅使用環境變數的設定？」                                                                        |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                  |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 供內建及外部發布外掛使用的安裝／更新提示。                                                                                                                                       |
| `openclaw.install.defaultChoice`                                                           | 有多個安裝來源可用時的偏好安裝路徑。                                                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | 支援的最低 OpenClaw 主機版本，使用如 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                                        |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用如 `>=2026.5.27` 的 semver 下限。                                                                                                   |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm 發行完整性字串，例如 `sha512-...`；安裝與更新流程會據此驗證擷取的成品。                                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定無效時，允許使用範圍受限的內建外掛重新安裝復原路徑。                                                                                                                         |
| `openclaw.install.requiredPlatformPackages`                                                | 當其鎖定檔平台限制符合目前主機時，必須實體安裝的 npm 套件別名。                                                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允許設定執行階段的頻道介面在開始監聽前載入，然後將完整的已設定頻道外掛延後到開始監聽後再啟用。                                                                                    |

資訊清單中繼資料決定執行階段載入前，初始設定中會顯示哪些供應商／頻道／設定選項。`package.json#openclaw.install` 會告訴初始設定流程，當使用者選擇其中一個選項時，該如何擷取或啟用此外掛。請勿將安裝提示移至 `openclaw.plugin.json`。

對非內建外掛來源，安裝及載入資訊清單登錄檔時會強制執行 `openclaw.install.minHostVersion`。無效值會遭拒；有效但較新的值，會使較舊主機略過外部外掛。內建來源外掛視為與主機簽出版本一致。

`openclaw.install.requiredPlatformPackages` 適用於透過選用、平台專屬別名提供必要原生二進位檔的 npm 套件。請為每個支援的平台別名列出不含版本限定的 npm 套件名稱。npm 安裝期間，OpenClaw 只會驗證鎖定檔限制符合目前主機的已宣告別名。若 npm 回報成功卻省略該別名，OpenClaw 會使用全新快取重試一次；若該別名仍缺失，則回復安裝。

對非內建外掛來源，套件安裝期間會強制執行 `openclaw.compat.pluginApi`。請用它指定套件建置時所依據的 OpenClaw 外掛 SDK／執行階段 API 下限。當外掛套件需要較新的 API，但仍刻意保留較低的安裝提示供其他流程使用時，它可以比 `minHostVersion` 更嚴格。依預設，OpenClaw 官方版本同步會將現有官方外掛的 API 下限提升至該 OpenClaw 發行版本；但若套件有意支援較舊主機，僅發布外掛的版本可以保留較低下限。請勿只使用套件版本作為相容性契約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 會使用 `openclaw.compat.pluginApi` 契約進行安裝相容性判斷。

若外掛已發布至 ClawHub，官方隨選安裝中繼資料應使用 `clawhubSpec`；初始設定會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品資訊。對於尚未移至 ClawHub 的套件，`npmSpec` 仍作為相容性備援。

確切的 npm 版本固定已位於 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將確切規格與 `expectedIntegrity` 配對，確保所擷取的 npm 成品不再符合固定版本時，更新流程會以封閉方式失敗。為了相容性，互動式初始設定仍會提供受信任登錄檔的 npm 規格，包括不含版本限定的套件名稱與 dist-tag。目錄診斷可區分確切、浮動、已固定完整性、缺少完整性、套件名稱不符，以及無效預設選項等來源。當存在 `expectedIntegrity`，卻沒有可供其固定的有效 npm 來源時，也會發出警告。若存在 `expectedIntegrity`，安裝／更新流程會強制驗證；若省略，則會記錄登錄檔解析結果，但不固定完整性。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定的帳號時，頻道外掛應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及設定安全的組態、狀態和密鑰配接器；網路用戶端、閘道監聽器和傳輸執行階段則應保留在主要擴充功能進入點中。

執行階段進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓逸出套件目錄的 `openclaw.extensions` 路徑變成可載入。

`openclaw.install.allowInvalidConfigRecovery` 的適用範圍刻意受到嚴格限制。它不會讓任意損壞的設定變得可安裝。目前，它只允許安裝流程從特定的過時內建外掛升級失敗中復原，例如缺少內建外掛路徑，或同一內建外掛存在過時的 `channels.<id>` 項目。不相關的設定錯誤仍會阻止安裝，並指示操作者執行 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是供小型檢查器模組使用的套件中繼資料：

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

當設定、Doctor、狀態或唯讀存在性流程需要在完整頻道外掛載入前，以低成本探測驗證狀態的是／否結果時，請使用此中繼資料。持久化驗證狀態並不是已設定的頻道狀態：請勿使用此中繼資料自動啟用外掛、修復執行階段相依性，或判斷是否應載入頻道執行階段。目標匯出應是只讀取持久化狀態的小型函式；請勿透過完整頻道執行階段的彙總匯出檔來路由它。

`openclaw.channel.configuredState` 使用相同的結構，供低成本的僅環境變數已設定檢查使用：

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

當頻道可以從環境變數或其他極小型的非執行階段輸入判斷已設定狀態時，請使用此中繼資料。若檢查需要完整設定解析或真正的頻道執行階段，則將該邏輯保留在外掛的 `config.hasConfiguredState` 掛鉤中。

## 探索優先順序（重複的外掛 ID）

OpenClaw 會從三個根目錄探索外掛，依序檢查：隨 OpenClaw 提供的內建外掛、全域安裝根目錄（`~/.openclaw/extensions`）及目前工作區根目錄（`<workspace>/.openclaw/extensions`），再加上任何明確的 `plugins.load.paths` 項目。

若兩個探索結果具有相同的 `id`，只會保留優先順序**最高**的資訊清單；優先順序較低的重複項目會被捨棄，而不會並列載入。優先順序由高至低如下：

1. **設定選定** — 在 `plugins.entries.<id>` 中明確固定的路徑
2. **符合追蹤安裝記錄的全域安裝** — 透過 `openclaw plugin install`／`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤識別為相同 ID 的外掛，即使該 ID 也屬於內建外掛
3. **內建** — 隨 OpenClaw 提供的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項目

影響如下：

- 放置在工作區或全域根目錄中、未受追蹤的內建外掛分支版本或過時副本，不會遮蔽內建版本。
- 若要覆寫內建外掛，可針對該 ID 執行 `openclaw plugin install`，使受追蹤的全域安裝優先於內建副本；或透過 `plugins.entries.<id>` 固定特定路徑，使其憑藉設定選定的優先順序勝出。
- 系統會記錄遭捨棄的重複項目，讓 Doctor 和啟動診斷可以指出被捨棄的副本。
- 診斷會將設定選定的重複覆寫描述為明確覆寫，但仍會發出警告，讓過時分支版本和意外遮蔽保持可見。

## JSON Schema 要求

- **每個外掛都必須隨附 JSON Schema**，即使它不接受任何設定也一樣。
- 空結構描述亦可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- 結構描述會在讀取／寫入設定時進行驗證，而非在執行階段驗證。
- 使用新的設定鍵擴充或分支修改內建外掛時，請同時更新該外掛 `openclaw.plugin.json` 中的 `configSchema`。內建外掛的結構描述採嚴格模式，因此若在使用者設定中新增 `plugins.entries.<id>.config.myNewKey`，卻未將 `myNewKey` 加入 `configSchema.properties`，系統會在載入外掛執行階段之前拒絕該設定。

結構描述擴充範例：

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

- 未知的 `channels.*` 鍵會視為**錯誤**，除非外掛資訊清單已宣告該頻道 ID。如果相同 ID 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs` 中（亦即該外掛已被參照，但目前無法探索），OpenClaw 會改將其降級為**警告**。
- `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 若參照未知的外掛 ID，會產生**警告**（「已忽略過時的設定項目」），而非錯誤，因此升級及已移除／重新命名的外掛不會阻止閘道啟動。
- `plugins.slots.memory` 若參照未知的外掛 ID，會視為**錯誤**；但已知的官方外部外掛 `memory-lancedb` 除外，此時只會發出警告。
- 如果外掛已安裝，但其資訊清單或結構描述損壞或遺失，驗證將失敗，Doctor 也會回報此外掛錯誤。
- 如果外掛設定存在，但該外掛已**停用**，系統會保留設定，並在 Doctor 與日誌中顯示**警告**。

如需完整的 `plugins.*` 結構描述，請參閱[設定參考](/zh-TW/gateway/configuration)。

## 注意事項

- **原生 OpenClaw 外掛必須提供資訊清單**，包括從本機檔案系統載入的外掛。執行階段仍會另外載入外掛模組；資訊清單僅用於探索與驗證。
- 原生資訊清單使用 JSON5 解析，因此只要最終值仍為物件，即可使用註解、尾隨逗號及未加引號的鍵。
- 資訊清單載入器只會讀取已記載的資訊清單欄位。請避免使用自訂的頂層鍵。
- 外掛不需要相關功能時，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerCatalogEntry` 必須保持輕量，不應匯入大範圍的執行階段程式碼；請將其用於靜態提供者目錄中繼資料或範圍明確的探索描述項，而非請求期間的執行。
- 互斥外掛類型透過 `plugins.slots.*` 選取：`kind: "memory"` 使用 `plugins.slots.memory`（預設為 `memory-core`），`kind: "context-engine"` 使用 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此資訊清單中宣告互斥外掛類型。執行階段進入點的 `OpenClawPluginDefinition.kind` 已淘汰，僅保留作為舊版外掛的相容性後備機制。
- 環境變數中繼資料（`setup.providers[].envVars`、已淘汰的 `providerAuthEnvVars`，以及 `channelEnvVars`）僅具宣告用途。狀態、稽核、排程傳遞驗證及其他唯讀介面，在將環境變數視為已設定之前，仍會套用外掛信任與實際啟用原則。
- 如需必須使用提供者程式碼的執行階段精靈中繼資料，請參閱[提供者執行階段掛鉤](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果外掛依賴原生模組，請記載建置步驟及套件管理器允許清單的任何要求（例如 pnpm 的 `allow-build-scripts` 與 `pnpm rebuild <package>`）。

## 相關內容

<CardGroup cols={3}>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="rocket">
    開始使用外掛。
  </Card>
  <Card title="外掛架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概覽" href="/zh-TW/plugins/sdk-overview" icon="book">
    外掛 SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
