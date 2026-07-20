---
read_when:
    - 你正在建置 OpenClaw 外掛
    - 你需要發布外掛設定結構描述或偵錯外掛驗證錯誤
summary: 外掛資訊清單 + JSON 結構描述要求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-20T00:54:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7eb8ad70b4f2d5bb94f45f06bb1a9c5ece6be299c0057511cb80c5a70875563f
    source_path: plugins/manifest.md
    workflow: 16
---

本頁涵蓋**原生 OpenClaw 外掛資訊清單** `openclaw.plugin.json`。關於相容的套件配置（Codex、Claude、Cursor），請參閱[外掛套件](/zh-TW/plugins/bundles)。

相容的套件格式會改用各自的資訊清單檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些配置，但不會依照下方的 `openclaw.plugin.json` 結構描述進行驗證。對於相容套件，若配置符合 OpenClaw 的執行階段預期，OpenClaw 會讀取套件中繼資料、宣告的 Skills 根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的掛鉤套件。

每個原生 OpenClaw 外掛都**必須**在**外掛根目錄**中隨附 `openclaw.plugin.json`。OpenClaw 會讀取該檔案，以便在**不執行外掛程式碼**的情況下驗證設定。缺少資訊清單或資訊清單無效都會阻止設定驗證，並視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需原生功能模型與目前的外部相容性指引，請參閱[功能模型](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。其中的所有內容都必須能以足夠低的成本檢查，而無須啟動外掛執行階段。

**用途：**

- 外掛識別、設定驗證與設定 UI 提示
- 驗證、初始設定與安裝中繼資料（別名、自動啟用、提供者環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列簡寫的擁有權
- 靜態功能擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併至目錄與驗證介面的頻道特定設定中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼進入點或 npm 安裝中繼資料。這些內容應放在你的外掛程式碼和 `package.json` 中。

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
  "description": "OpenRouter 提供者外掛",
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
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API 金鑰",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API 金鑰",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API 金鑰",
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
| `id`                                 | 是       | `string`                     | 正式外掛 ID。這是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                         |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                                |
| `requiresPlugins`                    | 否       | `string[]`                   | 若要使此外掛生效，還必須安裝的外掛 ID。探索程序仍會讓外掛可供載入，但缺少任何必要外掛時會發出警告。                                                                                                                |
| `enabledByDefault`                   | 否       | `true`                       | 將內建外掛標示為預設啟用。省略此欄位或將其設為任何非 `true` 值，即可讓外掛保持預設停用。                                                                                                                                                |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 將內建外掛標示為僅在所列的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍具有優先權。                                                                                                                                    |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此正式外掛 ID 的舊版 ID。                                                                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提及這些供應商 ID 時，應自動啟用此外掛。                                                                                                                                                                             |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告 `plugins.slots.*` 使用的一種或多種互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個位置的外掛，會在同一個陣列中宣告這兩種種類。                                                                                                     |
| `channels`                           | 否       | `string[]`                   | 此外掛擁有的頻道 ID。用於探索和設定驗證。                                                                                                                                                                                                 |
| `providers`                          | 否       | `string[]`                   | 此外掛擁有的供應商 ID。                                                                                                                                                                                                                                          |
| `providerCatalogEntry`               | 否       | `string`                     | 相對於外掛根目錄的輕量供應商目錄模組路徑，用於限定於資訊清單範圍的供應商目錄中繼資料，無須啟用完整外掛執行階段即可載入。                                                                                         |
| `modelSupport`                       | 否       | `object`                     | 資訊清單擁有的模型系列簡寫中繼資料，用於在執行階段之前自動載入外掛。                                                                                                                                                                                 |
| `modelCatalog`                       | 否       | `object`                     | 此外掛所擁有供應商的宣告式模型目錄中繼資料。這是未來唯讀清單、初始設定、模型選擇器、別名及隱藏功能的控制平面合約，無須載入外掛執行階段。                                                 |
| `modelPricing`                       | 否       | `object`                     | 供應商擁有的外部定價查詢政策。使用此政策，可讓本機／自行託管的供應商不使用遠端定價目錄，或將供應商參照對應至 OpenRouter/LiteLLM 目錄 ID，而無須在核心中硬編碼供應商 ID。                                                     |
| `modelIdNormalization`               | 否       | `object`                     | 必須在供應商執行階段載入之前執行，由供應商擁有的模型 ID 別名／前綴清理。                                                                                                                                                                                   |
| `providerEndpoints`                  | 否       | `object[]`                   | 核心必須在供應商執行階段載入之前分類的供應商路由，由資訊清單擁有的端點主機／baseUrl 中繼資料。                                                                                                                                                    |
| `providerRequest`                    | 否       | `object`                     | 在供應商執行階段載入之前，由通用請求政策使用的低成本供應商系列與請求相容性中繼資料。                                                                                                                                                      |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 供應商預設集，讓設定或安裝介面無須在核心中硬編碼供應商特定整合即可提供。                                                                                                                             |
| `cliBackends`                        | 否       | `string[]`                   | 此外掛擁有的命令列介面推論後端 ID。用於從明確設定參照進行啟動時自動啟用。                                                                                                                                                                 |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 在執行階段載入之前進行冷啟動模型探索時，應探測其由外掛擁有之合成驗證鉤子的供應商或命令列介面後端參照。                                                                                                                                      |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 由內建外掛擁有的預留位置 API 金鑰值，代表非機密的本機、OAuth 或環境認證資訊狀態。                                                                                                                                                        |
| `commandAliases`                     | 否       | `object[]`                   | 此外掛擁有的命令名稱，應在執行階段載入之前產生可識別外掛的設定和命令列介面診斷。                                                                                                                                                        |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 僅用於用量／計費的供應商認證資訊。OpenClaw 使用這些名稱進行用量探索和機密資訊清理，但絕不會用於推論驗證。                                                                                                                                   |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 應重複使用另一個供應商 ID 進行驗證查詢的供應商 ID，例如與基礎供應商共用 API 金鑰和驗證設定檔的程式設計供應商。                                                                                                                  |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於初始設定選擇器、偏好供應商解析和簡易命令列介面旗標連接的低成本驗證選項中繼資料。                                                                                                                                                               |
| `activation`                         | 否       | `object`                     | 用於啟動、供應商、命令、頻道、路由及功能觸發式載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由外掛執行階段擁有。                                                                                               |
| `setup`                              | 否       | `object`                     | 探索及設定介面無須載入外掛執行階段即可檢查的低成本設定／初始設定描述元。                                                                                                                                                            |
| `qaRunners`                          | 否       | `object[]`                   | 共用 `openclaw qa` 主機在外掛執行階段載入之前使用的低成本 QA 執行器描述元。                                                                                                                                                                              |
| `contracts`                          | 否       | `object`                     | 外部驗證鉤子、嵌入、語音、即時轉錄、即時語音、媒體理解、影像／影片／音樂生成、網頁擷取、網頁搜尋、工作節點供應商、文件／網頁內容擷取及工具擁有權的靜態功能擁有權快照。 |
| `configContracts`                    | 否       | `object`                     | 由通用核心輔助函式使用，且由資訊清單擁有的設定行為：危險旗標偵測、SecretRef 遷移目標及舊版設定路徑縮限。請參閱 [configContracts 參考資料](#configcontracts-reference)。                                                      |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 針對 `contracts.mediaUnderstandingProviders` 中宣告之供應商 ID 的低成本媒體理解預設值。                                                                                                                                                                    |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.imageGenerationProviders` 中宣告的提供者 ID 提供低成本的圖片生成驗證中繼資料，包括提供者擁有的驗證別名與基礎 URL 防護條件。                                                                                                         |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.videoGenerationProviders` 中宣告的提供者 ID 提供低成本的影片生成驗證中繼資料，包括提供者擁有的驗證別名與基礎 URL 防護條件。                                                                                                         |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.musicGenerationProviders` 中宣告的提供者 ID 提供低成本的音樂生成驗證中繼資料，包括提供者擁有的驗證別名與基礎 URL 防護條件。                                                                                                         |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 為 `contracts.tools` 中宣告且由外掛擁有的工具提供低成本的可用性中繼資料。當工具在缺少設定、環境或驗證依據時不應載入執行階段，請使用此中繼資料。                                                                                                  |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 在載入執行階段之前，合併至探索與驗證介面的清單所屬頻道設定中繼資料。                                                                                                                                                                 |
| `skills`                             | 否       | `string[]`                   | 要載入的 Skill 目錄，以外掛根目錄為相對基準。                                                                                                                                                                                                                    |
| `name`                               | 否       | `string`                     | 人類可讀的外掛名稱。                                                                                                                                                                                                                                                |
| `description`                        | 否       | `string`                     | 顯示於外掛介面中的簡短摘要。                                                                                                                                                                                                                                    |
| `catalog`                            | 否       | `object`                     | 外掛目錄介面的選用呈現提示。此中繼資料不會安裝、啟用外掛，也不會授予外掛信任。                                                                                                                                               |
| `icon`                               | 否       | `string`                     | 市集／目錄卡片使用的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL；若省略此項或其無效，則改用預設外掛圖示。                                                                                                         |
| `version`                            | 否       | `string`                     | 僅供參考的外掛版本。                                                                                                                                                                                                                                              |
| `uiHints`                            | 否       | `Record<string, object>`     | 設定欄位的 UI 標籤、預留位置文字與敏感性提示。                                                                                                                                                                                                          |

## 目錄參考

`catalog` 為外掛瀏覽器提供選用的顯示提示。主機可以忽略這些提示。這些提示絕不會安裝或啟用外掛，也不會變更其執行階段行為或信任層級。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| 欄位      | 類型      | 含義                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | 目錄介面是否應精選此外掛。                       |
| `order`    | `number`  | 策展外掛之間的升冪顯示提示；較小的值會較早出現。 |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述相符 `contracts.*GenerationProviders` 清單中所宣告提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具無須匯入每個提供者外掛，即可判斷生成提供者是否可用。

這些欄位僅用於低成本的宣告式事實。傳輸、請求轉換、權杖重新整理、認證資訊驗證及實際生成行為仍由外掛執行階段負責。

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

| 欄位                  | 必填 | 類型       | 含義                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 否       | `string[]` | 應視為此生成提供者靜態驗證別名的其他提供者 ID。                                                       |
| `authProviders`        | 否       | `string[]` | 其已設定驗證設定檔應視為此生成提供者驗證方式的提供者 ID。                                                      |
| `configSignals`        | 否       | `object[]` | 適用於不使用驗證設定檔或環境變數也能設定之本機或自行託管提供者的低成本純設定可用性訊號。                 |
| `authSignals`          | 否       | `object[]` | 明確的驗證訊號。存在時，會取代由提供者 ID、`aliases` 和 `authProviders` 組成的預設訊號集。                     |
| `referenceAudioInputs` | 否       | `boolean`  | 僅限影片生成。提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。 |

每個 `configSignals` 項目支援：

| 欄位            | 必填 | 類型       | 含義                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是      | `string`   | 要檢查的外掛自有設定物件點路徑，例如 `plugins.entries.example.config`。                                                                                      |
| `overlayPath`    | 否       | `string`   | 根設定內的點路徑，其物件應在評估訊號前疊加至根物件。可將此用於 `image`、`video` 或 `music` 等功能專屬設定。   |
| `overlayMapPath` | 否       | `string`   | 根設定內的點路徑，其每個物件值都應疊加至根物件。可將此用於 `accounts` 等具名帳號對應表，其中任何已設定帳號皆應符合資格。 |
| `required`       | 否       | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不得為空；物件與陣列也不得為空。                                                  |
| `requiredAny`    | 否       | `string[]` | 有效設定內至少一個必須具有已設定值的點路徑。                                                                                                    |
| `mode`           | 否       | `object`   | 有效設定內選用的字串模式防護條件。純設定可用性僅適用於某一模式時使用此項。                                                                  |

每個 `mode` 防護條件支援：

| 欄位        | 必填 | 類型       | 含義                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | 否       | `string`   | 有效設定內的點路徑。預設為 `mode`。                          |
| `default`    | 否       | `string`   | 設定省略該路徑時使用的模式值。                                  |
| `allowed`    | 否       | `string[]` | 若存在，僅當有效模式為其中一個值時，訊號才會通過。 |
| `disallowed` | 否       | `string[]` | 若存在，當有效模式為其中一個值時，訊號會失敗。       |

每個 `authSignals` 項目支援：

| 欄位             | 必填 | 類型     | 含義                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                             |
| `providerBaseUrl` | 否       | `object` | 選用的防護條件，僅當所參照的已設定提供者使用允許的基底 URL 時，才會計入此訊號。驗證別名僅適用於特定 API 時使用此項。 |

每個 `providerBaseUrl` 防護條件支援：

| 欄位             | 必填 | 類型       | 含義                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string`   | 應檢查其 `baseUrl` 的提供者設定 ID。                                                                                                |
| `defaultBaseUrl`  | 否       | `string`   | 提供者設定省略 `baseUrl` 時所採用的基底 URL。                                                                                         |
| `allowedBaseUrls` | 是      | `string[]` | 此驗證訊號允許的基底 URL。若已設定或預設的基底 URL 與這些正規化值中的任何一個都不相符，便會忽略該訊號。 |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 結構，並以工具名稱作為索引鍵。`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 無須僅為使工具工廠回傳 `null` 而匯入外掛執行階段。

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

除了上述共用的 `configSignals`/`authSignals` 欄位外，`toolMetadata` 項目也接受 `optional`（將工具標示為非外掛啟用必要項目）和 `replaySafe`（將工具執行標示為可在未完成的模型輪次後安全重複）。

若工具沒有 `toolMetadata`，OpenClaw 會保留現有行為，並在工具合約符合政策時載入其擁有者外掛。對於工廠相依於驗證／設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個新手設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此項。提供者設定清單會使用這些資訊清單選項、由描述項衍生的設定選項，以及安裝目錄中繼資料，而不會載入提供者執行階段。

| 欄位                  | 必填 | 類型                                                                  | 說明                                                                                                      |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | 是      | `string`                                                              | 此選項所屬的提供者 ID。                                                                       |
| `method`              | 是      | `string`                                                              | 要分派至的驗證方法 ID。                                                                            |
| `choiceId`            | 是      | `string`                                                              | 新手引導和命令列介面流程使用的穩定驗證選項 ID。                                                   |
| `choiceLabel`         | 否       | `string`                                                              | 使用者可見的標籤。若省略，OpenClaw 會回退使用 `choiceId`。                                         |
| `choiceHint`          | 否       | `string`                                                              | 選擇器的簡短輔助文字。                                                                         |
| `icon`                | 否       | HTTPS URL                                                             | 在支援的新手引導用戶端中顯示於此選項旁的圖像。                                         |
| `website`             | 否       | HTTPS URL                                                             | 支援的新手引導用戶端顯示的產品、登入或安裝頁面。                             |
| `assistantPriority`   | 否       | `number`                                                              | 在助理驅動的互動式選擇器中，較小的值會排在前面。                                        |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                                        | 在助理選擇器中隱藏此選項，但仍允許透過命令列介面手動選取。                         |
| `deprecatedChoiceIds` | 否       | `string[]`                                                            | 應將使用者重新導向至此替代選項的舊版選項 ID。                                  |
| `groupId`             | 否       | `string`                                                              | 用於將相關選項分組的選用群組 ID。                                                           |
| `groupLabel`          | 否       | `string`                                                              | 該群組的使用者可見標籤。                                                                         |
| `groupHint`           | 否       | `string`                                                              | 群組的簡短輔助文字。                                                                          |
| `onboardingFeatured`  | 否       | `boolean`                                                             | 在互動式新手引導選擇器的精選層級中顯示此群組，並置於「更多⋯」項目之前。 |
| `optionKey`           | 否       | `string`                                                              | 簡單單一旗標驗證流程的內部選項鍵。                                                       |
| `cliFlag`             | 否       | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                            |
| `cliOption`           | 否       | `string`                                                              | 完整的命令列介面選項形式，例如 `--openrouter-api-key <key>`。                                              |
| `cliDescription`      | 否       | `string`                                                              | 命令列介面說明中使用的描述。                                                                             |
| `appGuidedSecret`     | 否       | `boolean`                                                             | 一個貼上的密鑰加上提供者預設值，即足以進行應用程式引導的設定。                              |
| `appGuidedDiscovery`  | 否       | `boolean`                                                             | 相符的執行階段驗證方法透過 `appGuidedSetup` 負責唯讀本機探索。                 |
| `appGuidedAuth`       | 否       | `"oauth"` \| `"device-code"`                                          | 由提供者擁有、可供原生設定用戶端通用呈現的互動式登入。                        |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些新手引導介面中。若省略，預設為 `["text-inference"]`。  |

當 `appGuidedDiscovery` 為 true 時，相符的提供者驗證方法必須公開
`appGuidedSetup.detect` 和 `appGuidedSetup.prepare`。偵測必須是
唯讀的：不得登入、拉取模型、下載或寫入設定。準備程序會重新檢查
確切選取的模型並傳回設定提案；OpenClaw 會隔離地即時測試該
提案，且僅在成功後提交。

## commandAliases 參考

當外掛擁有一個執行階段命令名稱，而使用者可能會誤將其放入 `plugins.allow`，或嘗試將其作為根命令列介面命令執行時，請使用 `commandAliases`。OpenClaw 使用此中繼資料進行診斷，而不匯入外掛執行階段程式碼。

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

| 欄位        | 必填 | 類型              | 說明                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 是      | `string`          | 屬於此外掛的命令名稱。                               |
| `kind`       | 否       | `"runtime-slash"` | 將此別名標記為聊天斜線命令，而非根命令列介面命令。 |
| `cliCommand` | 否       | `string`          | 若存在，可為命令列介面操作建議的相關根命令列介面命令。  |

## activation 參考

當外掛可以低成本宣告哪些控制平面事件應將其納入啟用／載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，而非生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證外掛程式碼已經執行。啟用規劃器使用這些欄位縮小候選外掛範圍，之後才會回退至現有資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和掛鉤。

優先使用已描述擁有權的最精確中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述元或 `contracts` 能表達該關係時，請使用這些欄位。對於無法由這些擁有權欄位表示的額外規劃器提示，請使用 `activation`。對於 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅適用於尚無擁有權欄位的內嵌代理程式框架 ID。

每個外掛都應有意設定 `activation.onStartup`。僅當外掛必須在閘道啟動期間執行時，才將其設為 `true`。當外掛在啟動時不會作用，且應僅由更精確的觸發條件載入時，請將其設為 `false`。省略 `onStartup` 不再會隱含地於啟動時載入外掛；請針對啟動、頻道、設定、代理程式框架、記憶體或其他更精確的啟用觸發條件，使用明確的啟用中繼資料。

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

| 欄位              | 必填 | 類型                                                 | 說明                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否       | `boolean`                                            | 明確的閘道啟動啟用設定。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 則使其在啟動時維持延遲載入，除非其他相符的觸發條件要求載入。 |
| `onProviders`      | 否       | `string[]`                                           | 應將此外掛納入啟用／載入計畫的提供者 ID。                                                                                                                      |
| `onAgentHarnesses` | 否       | `string[]`                                           | 應將此外掛納入啟用／載入計畫的內嵌代理程式框架執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                           |
| `onCommands`       | 否       | `string[]`                                           | 應將此外掛納入啟用／載入計畫的命令 ID。                                                                                                                       |
| `onChannels`       | 否       | `string[]`                                           | 應將此外掛納入啟用／載入計畫的頻道 ID。                                                                                                                       |
| `onRoutes`         | 否       | `string[]`                                           | 應將此外掛納入啟用／載入計畫的路由種類。                                                                                                                       |
| `onConfigPaths`    | 否       | `string[]`                                           | 當路徑存在且未明確停用時，應將此外掛納入啟動／載入計畫的根目錄相對設定路徑。                                                      |
| `onCapabilities`   | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛功能提示。可行時應優先使用更精確的欄位。                                                                                     |

目前的即時取用者：

- 閘道啟動規劃使用 `activation.onStartup` 進行明確的啟動匯入。
- 由命令觸發的命令列介面規劃會回退至舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理程式執行階段啟動規劃對內嵌測試框架使用 `activation.onAgentHarnesses`，並對命令列介面執行階段別名使用頂層 `cliBackends[]`。
- 由頻道觸發的設定／頻道規劃，在缺少明確的頻道啟用中繼資料時，會回退至舊版 `channels[]` 擁有權。
- 啟動外掛規劃會將 `activation.onConfigPaths` 用於非頻道的根設定介面，例如內建瀏覽器外掛的 `browser` 區塊。
- 由提供者觸發的設定／執行階段規劃，在缺少明確的提供者啟用中繼資料時，會回退至舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權。

規劃器診斷可以區分明確啟用提示與資訊清單擁有權回退。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用了 `commandAliases` 擁有權。這些原因標籤供主機診斷和測試使用；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當外掛在共用 `openclaw qa` 根目錄下提供一個或多個傳輸執行器時，請使用 `qaRunners`。請讓這項中繼資料保持低成本且為靜態；外掛
執行階段仍透過輕量的
`runtime-api.ts` 介面擁有實際的命令列介面註冊，該介面會匯出相符的 `qaRunnerCliRegistrations`。選用的
`adapterFactory` 可將傳輸公開給共用 QA 情境，而不變更已註冊命令的執行器。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "針對可拋棄的主伺服器執行以 Docker 為基礎的 Matrix 即時 QA 路徑"
    }
  ]
}
```

| 欄位         | 必要 | 類型     | 意義                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是      | `string` | 掛載於 `openclaw qa` 下的子命令，例如 `matrix`。    |
| `description` | 否       | `string` | 共用主機需要預留命令時使用的備援說明文字。 |

`adapterFactory` ID 必須與 `commandName` 相符。請勿為資訊清單中不存在的命令匯出註冊項目。

## setup 參考

當設定和導入介面需要在執行階段載入前取得低成本、由外掛擁有的中繼資料時，請使用 `setup`。

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
            "source": "openai 本機認證資訊"
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

頂層 `cliBackends` 仍然有效，並繼續描述命令列介面推論後端。`setup.cliBackends` 是控制平面／設定流程專用的描述元介面，應僅保留中繼資料。

存在時，`setup.providers` 和 `setup.cliBackends` 是設定探索的首選描述元優先查詢介面。如果描述元只縮小候選外掛的範圍，而設定仍需要更豐富的設定階段執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 會在一般提供者驗證和環境變數查詢中納入 `setup.providers[].envVars`。請將設定和狀態環境中繼資料放在此處。

當計費或組織層級的認證資訊必須啟用 `resolveUsageAuth`，但不得成為推論認證資訊時，請使用 `providerUsageAuthEnvVars`。這些名稱會納入工作區 dotenv 封鎖、ACP 子處理程序移除、沙箱機密篩選，以及廣泛的機密清理。提供者執行階段仍會在 `resolveUsageAuth` 內讀取並分類該值。

當沒有可用的設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 衍生簡單的設定選項。對於自訂標籤、命令列介面旗標、導入範圍和助理中繼資料，仍優先使用明確的 `providerAuthChoices` 項目。

只有當這些描述元足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅限描述元的合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 來進行設定查詢。如果僅限描述元的外掛仍隨附其中一個設定執行階段項目，OpenClaw 會回報附加診斷，並繼續忽略該項目。省略 `requiresRuntime` 會保留舊版回退行為，因此已新增描述元但未加入該旗標的現有外掛不會中斷。

由於設定查詢可以執行外掛所擁有的 `setup-api` 程式碼，正規化的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已探索的外掛之間必須保持唯一。若擁有權不明確，系統會採取封閉式失敗，而不會依探索順序選出勝者。

設定執行階段實際執行時，如果 `setup-api` 註冊了資訊清單描述元未宣告的提供者或命令列介面後端，或描述元沒有相符的執行階段註冊，設定登錄檔診斷會回報描述元偏移。這些診斷是附加性的，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位          | 必要 | 類型       | 意義                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是      | `string`   | 在設定或導入期間公開的提供者 ID。請讓正規化 ID 在全域保持唯一。             |
| `authMethods`  | 否       | `string[]` | 此提供者在不載入完整執行階段的情況下支援的設定／驗證方法 ID。                       |
| `envVars`      | 否       | `string[]` | 一般設定／狀態介面可在外掛執行階段載入前檢查的環境變數。               |
| `authEvidence` | 否       | `object[]` | 對可透過非機密標記進行驗證的提供者執行低成本的本機驗證證據檢查。 |

`authEvidence` 用於由提供者擁有、無須載入執行階段程式碼即可驗證的本機認證資訊標記。這些檢查必須保持低成本且僅限本機：不得進行網路呼叫、不得讀取鑰匙圈或機密管理員、不得執行 Shell 命令，也不得探查提供者 API。

支援的證據項目：

| 欄位              | 必要 | 類型       | 意義                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是      | `string`   | 目前為 `local-file-with-env`。                                                                               |
| `fileEnvVar`       | 否       | `string`   | 包含明確認證資訊檔案路徑的環境變數。                                                           |
| `fallbackPaths`    | 否       | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機認證資訊檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。 |
| `requiresAnyEnv`   | 否       | `string[]` | 至少一個列出的環境變數必須非空，證據才有效。                                    |
| `requiresAllEnv`   | 否       | `string[]` | 每個列出的環境變數都必須非空，證據才有效。                                           |
| `credentialMarker` | 是      | `string`   | 證據存在時傳回的非機密標記。                                                       |
| `source`           | 否       | `string`   | 驗證／狀態輸出中面向使用者的來源標籤。                                                               |

### setup 欄位

| 欄位              | 必要 | 類型       | 意義                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在設定和導入期間公開的提供者設定描述元。                                     |
| `cliBackends`      | 否       | `string[]` | 用於描述元優先設定查詢的設定階段後端 ID。請讓正規化 ID 在全域保持唯一。 |
| `configMigrations` | 否       | `string[]` | 由此外掛設定介面擁有的設定遷移 ID。                                          |
| `requiresRuntime`  | 否       | `boolean`  | 設定在描述元查詢後是否仍需要執行 `setup-api`。                            |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應至小型呈現提示的映射。索引鍵可使用點號表示巢狀設定欄位，但任何路徑區段都不得為 `__proto__`、`constructor` 或 `prototype`；設定程序會拒絕這些名稱。

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

每個欄位提示可包含：

| 欄位         | 類型       | 意義                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 面向使用者的欄位標籤。                |
| `help`        | `string`   | 簡短的輔助說明文字。                      |
| `tags`        | `string[]` | 選用的使用者介面標籤。                       |
| `advanced`    | `boolean`  | 將欄位標記為進階。            |
| `sensitive`   | `boolean`  | 將欄位標記為機密或敏感。 |
| `placeholder` | `string`   | 表單輸入的預留位置文字。       |

## contracts 參考

僅將 `contracts` 用於 OpenClaw 無須匯入外掛執行階段即可讀取的靜態功能擁有權中繼資料。

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

| 欄位                            | 類型       | 意義                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 擴充功能工廠 ID，目前為 `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果中介軟體的執行階段 ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任工具執行前政策 ID。隨附外掛無須此欄位即可註冊政策。 |
| `externalAuthProviders`          | `string[]` | 此外掛擁有其外部驗證設定檔鉤子的提供者 ID。                                                                      |
| `embeddingProviders`             | `string[]` | 此外掛擁有的通用嵌入提供者 ID，用於可重複使用的向量嵌入用途，包括記憶。                                 |
| `speechProviders`                | `string[]` | 此外掛擁有的語音提供者 ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄提供者 ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音提供者 ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | 此外掛擁有的已棄用記憶專用嵌入提供者 ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解提供者 ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源提供者 ID。                                                                                     |
| `documentExtractors`             | `string[]` | 此外掛擁有的文件（例如 PDF）擷取器提供者 ID。                                                                  |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的影像生成提供者 ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成提供者 ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | 此外掛擁有的音樂生成提供者 ID。                                                                                      |
| `webContentExtractors`           | `string[]` | 此外掛擁有的網頁內容擷取提供者 ID。                                                                           |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取提供者 ID。                                                                                             |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋提供者 ID。                                                                                            |
| `workerProviders`                | `string[]` | 此外掛擁有的雲端工作站提供者 ID，用於佈建及由設定檔支援的租約生命週期。                                      |
| `usageProviders`                 | `string[]` | 此外掛擁有其用量驗證和用量快照鉤子的提供者 ID。                                                             |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 擁有的匯入提供者 ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | 保留權限，用於在處理程序內分派閘道方法的已驗證外掛 HTTP 路由。                                  |
| `tools`                          | `string[]` | 此外掛擁有的代理工具名稱。                                                                                                   |

`contracts.embeddedExtensionFactories` 保留供隨附的 Codex app-server 專用擴充功能工廠使用。隨附的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。只有在明確啟用時，已安裝外掛才能使用相同的中介軟體接縫，且僅限於其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段。

需要主機受信任工具執行前政策層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機 ID，並明確啟用。隨附外掛保留現有的受信任政策路徑，但具有未宣告政策 ID 的已安裝外掛會在註冊前遭到拒絕。政策 ID 的範圍限定於註冊該 ID 的外掛，因此兩個外掛都可以宣告並註冊 `workflow-budget`；單一外掛不得重複註冊相同的本機 ID。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，僅載入可擁有所要求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的提供者外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證鉤子會被忽略。

同時實作 `resolveUsageAuth` 和 `fetchUsageSnapshot` 的提供者外掛，應在 `contracts.usageProviders` 中宣告每個自動探索的提供者 ID。用量探索會在載入執行階段程式碼前讀取此合約，接著僅載入已宣告的擁有者，並在載入後驗證這兩個鉤子。

通用嵌入提供者應為使用 `api.registerEmbeddingProvider(...)` 註冊的每個配接器宣告 `contracts.embeddingProviders`。將通用合約用於可重複使用的向量生成，包括供記憶搜尋使用的提供者。`contracts.memoryEmbeddingProviders` 是已棄用的記憶專用相容性，僅在現有提供者移轉至通用嵌入提供者接縫期間保留。

工作站提供者必須在 `contracts.workerProviders` 中宣告每個 `api.registerWorkerProvider(...)` ID。核心會在呼叫 `provision` 前保存持久意圖；提供者會在外部配置前驗證其設定，而且使用相同操作 ID 的重複呼叫必須採用相同租約。核心也會保存該已驗證的設定快照，並將其連同 `leaseId` 傳遞給 `inspect({ leaseId, profile })` 和 `destroy({ leaseId, profile })`，包括在具名設定檔遭到變更或移除後。銷毀具有冪等性，檢查會傳回封閉的 `active` / `destroyed` / `unknown` 狀態聯集，而 SSH 私密金鑰資料僅透過 `SecretRef` 參照。已佈建的 SSH 端點也必須包含來自受信任佈建輸出的公開 `hostKey`，其格式必須完全符合 `algorithm base64`，不得包含主機名稱或註解，讓核心可在連線前釘選主機。建立動態身分參照的提供者可實作具權威性的 `resolveSshIdentity({ leaseId, profile, keyRef })`；未實作的提供者則使用核心的通用秘密解析器。具權威性的 `unknown` 會將作用中的本機記錄標記為孤立；在保存銷毀要求後，它會確認拆除完成。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。這是原生外掛 HTTP 路由的 API 衛生閘門；這些路由會刻意在處理程序內分派閘道控制平面方法，而它並非防範惡意原生外掛的沙箱。僅應用於已經需要閘道 HTTP 驗證，且經過嚴格審查的隨附／操作員介面。只有在具備權限的路由同時宣告 `auth: "gateway"` 和路由專用的 `gatewayRuntimeScopeSurface: "trusted-operator"` 時，該路由才會在閘道根工作接納關閉期間繼續可供存取；同一外掛的一般同層路由仍位於接納邊界之後。如此可讓暫停狀態與恢復功能保持可供存取，而不會授予整個外掛略過接納的權限。應在分派之外限制解析和回應塑形的範圍；實質性或變更性的工作必須經由閘道方法分派，此分派負責接納與範圍強制執行。

## configContracts 參考

對於通用核心輔助程式需要、但不匯入外掛執行階段的資訊清單所擁有設定行為，請使用 `configContracts`：危險旗標偵測、SecretRef 移轉目標，以及舊版設定路徑縮限。

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
          "path": "routes.*.secret",
          "expected": "string",
          "ownerKind": "route"
        }
      ]
    }
  }
}
```

| 欄位                         | 必要 | 類型       | 意義                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否       | `string[]` | 表示此外掛的設定階段相容性移轉可能適用的根目錄相對設定路徑。當設定從未參照此外掛時，可讓通用執行階段設定讀取略過此外掛的所有設定介面。                 |
| `compatibilityRuntimePaths`   | 否       | `string[]` | 在外掛程式碼完全啟用前，此外掛可於執行階段處理的根目錄相對相容性路徑。將其用於應縮小隨附候選集合範圍，而不需匯入每個相容外掛執行階段的舊版介面。 |
| `dangerousFlags`              | 否       | `object[]` | 啟用時，`openclaw doctor` 應標示為不安全或危險的設定常值。請見下文。                                                                                                                                   |
| `secretInputs`                | 否       | `object`   | `plugins.entries.<id>.config` 下用於 SecretRef 移轉、稽核、啟動實體化，以及選用執行階段擁有者隔離的設定路徑。請見下文。                                                                             |

每個 `dangerousFlags` 項目支援：

| 欄位    | 必要 | 類型                                  | 意義                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | 是      | `string`                              | 相對於 `plugins.entries.<id>.config`、以句點分隔的設定路徑。支援對應／陣列區段的 `*` 萬用字元。 |
| `equals` | 是      | `string \| number \| boolean \| null` | 將此設定值標記為危險的確切常值。                                                            |

`secretInputs` 支援：

| 欄位                    | 必填 | 類型       | 意義                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否   | `boolean`  | 決定此 SecretRef 介面是否啟用時，覆寫隨附外掛的預設啟用狀態。當外掛已隨附，但此介面在設定中明確啟用之前應維持停用時，請使用此項。                                                                                                                                            |
| `paths`                 | 是   | `object[]` | 機密資料形式的設定路徑；每個路徑包含 `path`（以點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元）、選用的 `expected`（目前僅支援 `"string"`），以及選用的 `ownerKind`（目前僅支援 `"route"`）。解析失敗時，已宣告的擁有者只會隔離完全相符的路徑；其擁有者 ID 是完整設定路徑。 |

## mediaUnderstandingProviderMetadata 參考資料

當媒體理解供應商具有預設模型、自動認證備援優先順序，或通用核心輔助程式需要在執行階段載入前得知的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。金鑰也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

每個供應商項目可包含：

| 欄位                   | 類型                                                             | 意義                                                                                                            |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此供應商提供的媒體能力。                                                                                       |
| `defaultModels`        | `Record<string, string>`                                         | 設定未指定模型時使用的能力對應模型預設值。                                                                     |
| `autoPriority`         | `Record<string, number>`                                         | 依認證資訊自動進行供應商備援時，數字越小排序越前面。                                                           |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 供應商支援的原生文件輸入。                                                                                     |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 各文件類型的模型覆寫。將 `image: false` 設定為停用該文件類型的影像式擷取。 |

## channelConfigs 參考資料

當頻道外掛需要在執行階段載入前取得低成本的設定中繼資料時，請使用 `channelConfigs`。若沒有設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段，唯讀的頻道設定／狀態探索可直接將此中繼資料用於已設定的外部頻道。

`channelConfigs` 是外掛資訊清單中繼資料，而不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定頻道執行個體。OpenClaw 會讀取資訊清單中繼資料，以便在外掛執行階段程式碼執行前，判斷哪個外掛擁有該已設定頻道。

對頻道外掛而言，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非隨附外掛，也應宣告相符的 `channelConfigs` 項目。若未宣告，OpenClaw 仍可載入外掛，但在外掛執行階段執行前，冷路徑設定結構描述、設定流程及控制介面無法得知該頻道所擁有的選項結構。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可宣告靜態 `auto` 預設值，供頻道執行階段載入前執行的命令設定檢查使用。隨附頻道也可透過 `package.json#openclaw.channel.commands`，連同其他由套件擁有的頻道目錄中繼資料，發布相同的預設值。

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
          "label": "主伺服器 URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix 主伺服器連線",
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

| 欄位          | 類型                     | 意義                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的頻道設定項目都必須提供。         |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用介面標籤／預留位置／敏感資料提示。                                  |
| `label`       | `string`                 | 執行階段中繼資料尚未就緒時，合併至選擇器與檢查介面的頻道標籤。                          |
| `description` | `string`                 | 用於檢查與目錄介面的簡短頻道說明。                                                       |
| `commands`    | `object`                 | 執行階段前設定檢查所用的靜態原生命令與原生 Skills 自動預設值。                          |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於的舊版或較低優先順序外掛 ID。                                 |

### 取代另一個頻道外掛

當你的外掛是某個頻道 ID 的首選擁有者，而另一個外掛也能提供該頻道時，請使用 `preferOver`。常見情況包括重新命名的外掛 ID、取代隨附外掛的獨立外掛，或為了設定相容性而保留相同頻道 ID 的維護中分支。

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

設定 `channels.chat` 後，OpenClaw 會同時考量頻道 ID 與首選外掛 ID。如果較低優先順序的外掛只是因為隨附或預設啟用而被選中，OpenClaw 會在有效執行階段設定中停用它，讓單一外掛擁有該頻道及其工具。明確的使用者選擇仍然優先：如果使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇，並回報重複頻道／工具診斷，而不會默默變更所要求的外掛集合。

請將 `preferOver` 限定於確實能提供相同頻道的外掛 ID。它不是通用優先順序欄位，也不會重新命名使用者設定金鑰。

## modelSupport 參考資料

當 OpenClaw 應在外掛執行階段載入前，根據 `gpt-5.6-sol` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷你的供應商外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 採用下列優先順序：

- 明確的 `provider/model` 參照使用所屬 `providers` 的資訊清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非隨附外掛和一個隨附外掛都相符，則非隨附外掛優先
- 其餘歧義會被忽略，直到使用者或設定指定供應商

欄位：

| 欄位            | 類型       | 意義                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 與簡寫模型 ID 進行比對的前綴。                 |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，與簡寫模型 ID 比對的規則運算式來源。 |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯；其中會拒絕含有巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被默默略過，處理方式與語法無效的規則運算式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考資料

當 OpenClaw 應在載入外掛執行階段前得知供應商模型中繼資料時，請使用 `modelCatalog`。這是固定目錄資料列、供應商別名、抑制規則及探索模式的資訊清單所擁有來源。執行階段重新整理仍由供應商執行階段程式碼負責，但資訊清單會告知核心何時需要執行階段。

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
        "reason": "無法在 Azure OpenAI Responses 上使用"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

頂層欄位：

| 欄位            | 類型                                                     | 意義                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此外掛所擁有之提供者 ID 的目錄資料列。鍵也應出現在頂層 `providers` 中。       |
| `aliases`        | `Record<string, object>`                                 | 在目錄或抑制規劃中，應解析為所擁有提供者的提供者別名。              |
| `suppressions`   | `object[]`                                               | 此外掛因提供者特定原因而抑制的其他來源模型資料列。                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄是否可從資訊清單中繼資料讀取、重新整理至快取，或需要執行階段。 |
| `runtimeAugment` | `boolean`                                                | 僅當提供者執行階段必須在資訊清單／設定規劃後附加目錄資料列時，才設為 `true`。       |

`aliases` 參與模型目錄規劃的提供者擁有權查找。別名目標必須是同一外掛所擁有的頂層提供者。當依提供者篩選的清單使用別名時，OpenClaw 可讀取其擁有者的資訊清單，並套用別名 API／基底 URL 覆寫，而無須載入提供者執行階段。別名不會展開未篩選的目錄清單；廣泛清單僅輸出擁有者的標準提供者資料列。

`suppressions` 取代舊有的提供者執行階段 `suppressBuiltInModel` 掛鉤。只有在提供者由此外掛擁有，或宣告為以所擁有提供者為目標的 `modelCatalog.aliases` 鍵時，才會採用抑制項目。模型解析期間不再呼叫執行階段抑制掛鉤。

提供者欄位：

| 欄位                 | 類型                     | 意義                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | 此提供者目錄中模型的選用預設基底 URL。                                                                                                                                                    |
| `api`                 | `ModelApi`               | 此提供者目錄中模型的選用預設 API 轉接器。                                                                                                                                                 |
| `headers`             | `Record<string, string>` | 套用於此提供者目錄的選用靜態標頭。                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | 提供者為簡短內部公用工作（標題、進度敘述）建議的選用小型模型 ID。當未設定 `agents.defaults.utilityModel`，且此提供者供應代理程式的主要模型時使用。 |
| `models`              | `object[]`               | 必要的模型資料列。沒有 `id` 的資料列會被忽略。                                                                                                                                                            |

模型欄位：

| 欄位              | 類型                                                           | 意義                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供者本機模型 ID，不含 `provider/` 前綴。                    |
| `name`             | `string`                                                       | 選用顯示名稱。                                                      |
| `api`              | `ModelApi`                                                     | 選用的各模型 API 覆寫。                                            |
| `baseUrl`          | `string`                                                       | 選用的各模型基底 URL 覆寫。                                       |
| `headers`          | `Record<string, string>`                                       | 選用的各模型靜態標頭。                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被無聲捨棄。            |
| `reasoning`        | `boolean`                                                      | 模型是否提供推理行為。                               |
| `contextWindow`    | `number`                                                       | 提供者原生上下文視窗。                                             |
| `contextTokens`    | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段上下文上限。 |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出權杖數。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的各思考層級模型 ID 或參數覆寫。                    |
| `cost`             | `object`                                                       | 選用的每百萬權杖美元定價，包括選用的 `tieredPricing`。 |
| `compat`           | `object`                                                       | 與 OpenClaw 模型設定相容性相符的選用相容性旗標。  |
| `mediaInput`       | `object`                                                       | 選用的各模態輸入設定，目前僅限影像。                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 清單狀態。僅當資料列完全不得出現時才予以抑制。          |
| `statusReason`     | `string`                                                       | 與非可用狀態一同顯示的選用原因。                            |
| `replaces`         | `string[]`                                                     | 此模型所取代的舊版提供者本機模型 ID。                       |
| `replacedBy`       | `string`                                                       | 已棄用資料列的替代提供者本機模型 ID。                    |
| `tags`             | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                    |

抑制欄位：

| 欄位                      | 類型       | 意義                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制之上游資料列的提供者 ID。必須由此外掛擁有，或宣告為所擁有的別名。 |
| `model`                    | `string`   | 要抑制的提供者本機模型 ID。                                                                      |
| `reason`                   | `string`   | 直接要求被抑制資料列時顯示的選用訊息。                                     |
| `when.baseUrlHosts`        | `string[]` | 套用抑制前所需的有效提供者基底 URL 主機選用清單。               |
| `when.providerConfigApiIn` | `string[]` | 套用抑制前所需之確切提供者設定 `api` 值的選用清單。              |

請勿將僅限執行階段的資料放入 `modelCatalog`。只有在資訊清單資料列足夠完整，使依提供者篩選的清單與選擇器介面可略過登錄／執行階段探索時，才使用 `static`。當資訊清單資料列是實用、可列出的種子或補充資料，但重新整理／快取稍後可新增更多資料列時，請使用 `refreshable`；可重新整理的資料列本身並非權威來源。當 OpenClaw 必須載入提供者執行階段才能得知清單時，請使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 執行必須在提供者執行階段載入前完成、成本低廉且由提供者擁有的模型 ID 清理。如此可將短模型名稱、提供者本機舊版 ID 與 Proxy 前綴規則等別名保留在擁有者外掛的資訊清單中，而非核心模型選擇表中。

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

| 欄位                                | 類型                    | 意義                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依原樣傳回。                  |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版提供者／模型重複情形。     |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 與 `prefix` 為鍵。 |

## providerEndpoints 參考

使用 `providerEndpoints` 進行一般要求原則在提供者執行階段載入前必須得知的端點分類。核心仍負責定義每個 `endpointClass` 的意義；外掛資訊清單則擁有主機與基底 URL 中繼資料。

正式外部化的提供者外掛會從核心散發套件中排除，因此在安裝前無法看見其資訊清單。它們的 `providerEndpoints` 也必須鏡像於 `scripts/lib/official-external-provider-catalog.json` 中，讓端點分類在沒有外掛時仍可運作；合約測試會強制執行此鏡像要求。

端點欄位：

| 欄位                          | 類型       | 意義                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 對應至端點類別的確切主機名稱。                                                |
| `hostSuffixes`                 | `string[]` | 對應至端點類別的主機後綴。加上 `.` 前綴可僅比對網域後綴。 |
| `baseUrls`                     | `string[]` | 對應至端點類別的確切正規化 HTTP(S) 基底 URL。                             |
| `googleVertexRegion`           | `string`   | 確切全域主機所使用的靜態 Google Vertex 區域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機中移除的後綴，以顯示 Google Vertex 區域前綴。                 |

## providerRequest 參考資料

當通用要求原則需要輕量的要求相容性中繼資料，又不希望載入供應商執行階段時，請使用 `providerRequest`。將特定行為的承載內容改寫保留在供應商執行階段掛鉤或共用的供應商系列輔助程式中。

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

| 欄位                 | 類型         | 意義                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用要求相容性決策與診斷所使用的供應商系列標籤。 |
| `compatibilityFamily` | `"moonshot"` | 共用要求輔助程式可選用的供應商系列相容性分類。              |
| `openAICompletions`   | `object`     | OpenAI 相容的補全要求旗標，目前為 `supportsStreamingUsage`。       |

## secretProviderIntegrations 參考資料

當外掛可發布可重複使用的 SecretRef exec 供應商預設時，請使用 `secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料、將外掛擁有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際的祕密解析留給 SecretRef 執行階段。預設僅會向隨附外掛，以及從受管理的外掛安裝根目錄中探索到的已安裝外掛公開，例如透過 git 和 ClawHub 安裝的外掛。

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

對應表索引鍵是整合 ID。若省略 `providerAlias`，OpenClaw 會使用整合 ID 作為 SecretRef 供應商別名。供應商別名必須符合一般 SecretRef 供應商別名模式，例如 `team-secrets` 或 `onepassword-work`。

當操作人員選取預設時，OpenClaw 會寫入如下的供應商參照：

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

在啟動／重新載入時，OpenClaw 會載入目前的外掛資訊清單中繼資料、檢查擁有該供應商的外掛是否已安裝並啟用，並根據資訊清單實體化 exec 命令，以解析該供應商。停用或移除外掛會撤銷使用中 SecretRef 的供應商。若操作人員希望使用獨立的 exec 設定，仍可直接手動寫入 `command`/`args` 供應商。

目前僅支援 `source: "exec"` 預設。`command` 必須是 `${node}`，而 `args[0]` 必須是相對於外掛根目錄的 `./` 解析器指令碼。OpenClaw 會在啟動／重新載入時，將其實體化為目前的 Node 可執行檔與外掛內指令碼的絕對路徑。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 選項不屬於資訊清單預設合約。需要非 Node 命令的操作人員，可直接設定獨立的手動 exec 供應商。

對於資訊清單預設，OpenClaw 會根據外掛根目錄衍生 `trustedDirs`；若是 `${node}` 預設，則也會根據目前的 Node 可執行檔目錄衍生。資訊清單中撰寫的 `trustedDirs` 會被忽略。其他 exec 供應商選項，例如 `timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath`，會直接傳遞至一般的 SecretRef exec 供應商設定。

## modelPricing 參考資料

當供應商需要在執行階段載入前控制控制平面的定價行為時，請使用 `modelPricing`。閘道定價快取會在不匯入供應商執行階段程式碼的情況下讀取此中繼資料。

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

| 欄位        | 類型              | 意義                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對絕不應擷取 OpenRouter 或 LiteLLM 定價的本機／自行託管供應商，設為 `false`。 |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此供應商的 OpenRouter 查詢。           |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此供應商的 LiteLLM 查詢。                 |

來源欄位：

| 欄位                      | 類型               | 意義                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄供應商 ID 與 OpenClaw 供應商 ID 不同時使用的 ID，例如 `zai` 供應商使用的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀的供應商／模型參照，適用於 OpenRouter 等代理供應商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的點分版本 ID。            |

### OpenClaw 供應商索引

OpenClaw 供應商索引是由 OpenClaw 擁有的預覽中繼資料，適用於外掛可能尚未安裝的供應商。它不屬於外掛資訊清單。外掛資訊清單仍是已安裝外掛的權威來源。供應商索引是內部備援合約，未來的可安裝供應商與安裝前模型選擇器介面會在供應商外掛尚未安裝時使用它。

目錄權威來源順序：

1. 使用者設定。
2. 已安裝外掛資訊清單 `modelCatalog`。
3. 透過明確重新整理取得的模型目錄快取。
4. OpenClaw 供應商索引預覽資料列。

供應商索引不得包含祕密、啟用狀態、執行階段掛鉤或即時的帳戶特定模型資料。其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 供應商資料列形狀，但除非刻意讓 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位與已安裝外掛資訊清單保持一致，否則應僅限於穩定的顯示中繼資料。具有即時 `/models` 探索功能的供應商，應透過明確的模型目錄快取路徑寫入重新整理後的資料列，而不是讓一般清單顯示或新手設定流程呼叫供應商 API。

對於外掛已移出核心或尚未安裝的供應商，供應商索引項目也可包含可安裝外掛的中繼資料。此中繼資料遵循頻道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及輕量的驗證選項標籤，足以顯示可安裝的設定選項。外掛安裝後，其資訊清單優先，且會忽略該供應商的供應商索引項目。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層資訊清單能力索引鍵移轉至 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些索引鍵（或任何其他能力清單）都不再作為頂層資訊清單欄位讀取；一般資訊清單載入僅會辨識 `contracts` 下的這些索引鍵。

## 資訊清單與 package.json 的比較

這兩個檔案各有不同用途：

| 檔案                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選項中繼資料，以及必須在外掛程式碼執行前存在的 UI 提示                         |
| `package.json`         | npm 中繼資料、相依套件安裝，以及用於進入點、安裝限制、設定或目錄中繼資料的 `openclaw` 區塊 |

若不確定某項中繼資料應放在哪裡，請遵循以下規則：

- 若 OpenClaw 必須在載入外掛程式碼前得知它，請將其放入 `openclaw.plugin.json`
- 若它與封裝、進入點檔案或 npm 安裝行為有關，請將其放入 `package.json`

### 影響探索的 package.json 欄位

部分執行階段前的外掛中繼資料會刻意放在 `package.json` 的 `openclaw` 區塊下，而不是 `openclaw.plugin.json`。`openclaw.bundle` 和 `openclaw.bundle.json` 並非 OpenClaw 外掛合約；原生外掛必須使用 `openclaw.plugin.json`，以及下列受支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                      | 含義                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須位於外掛套件目錄內。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須位於外掛套件目錄內。                                                                 |
| `openclaw.setupEntry`                                                                      | 僅供輕量設定使用的進入點，用於新手引導、延後啟動頻道，以及唯讀的頻道狀態／SecretRef 探索。必須位於外掛套件目錄內。 |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的建置後 JavaScript 設定進入點。需要 `setupEntry`、必須存在，且必須位於外掛套件目錄內。                         |
| `openclaw.channel`                                                                         | 輕量頻道目錄中繼資料，例如標籤、文件路徑、別名與選項文案。                                                                                                 |
| `openclaw.channel.approvalFlags`                                                           | 執行階段載入前可用的封閉式核准行為旗標。`native` 表示該頻道擁有原生核准 UI 與同一回合內的處理能力。                                           |
| `openclaw.channel.commands`                                                                | 靜態原生命令與原生 Skill 自動預設中繼資料，在頻道執行階段載入前供設定、稽核與命令清單介面使用。                                          |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，無須載入完整頻道執行階段即可回答「是否已存在僅使用環境變數的設定？」                                         |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證檢查器中繼資料，無須載入完整頻道執行階段即可回答「是否已有任何登入狀態？」                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 隨附與外部發布外掛的安裝／更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 有多個安裝來源可用時的偏好安裝路徑。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                             |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用像 `>=2026.5.27` 這樣的 semver 下限。                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝與更新流程會依此驗證所擷取的成品。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定無效時，允許採用範圍有限的隨附外掛重新安裝復原路徑。                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | 當其鎖定檔平台限制符合目前主機時，必須實體安裝的 npm 套件別名。                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允許設定執行階段的頻道介面在開始監聽前載入，接著將完整且已設定的頻道外掛延後至開始監聽後再啟用。                                                 |

資訊清單中繼資料決定執行階段載入前，哪些提供者／頻道／設定選項會出現在新手引導中。`package.json#openclaw.install` 會告知新手引導，使用者選擇其中一個選項時該如何擷取或啟用該外掛。請勿將安裝提示移至 `openclaw.plugin.json`。

對於非隨附外掛來源，安裝期間與資訊清單登錄載入期間都會強制執行 `openclaw.install.minHostVersion`。無效值會遭拒絕；較新但有效的值會讓較舊主機略過外部外掛。隨附的原始碼外掛則假定與主機簽出版本一致。

`openclaw.install.requiredPlatformPackages` 適用於透過選用且平台特定的別名提供必要原生二進位檔的 npm 套件。請列出每個支援平台別名的不含版本 npm 套件名稱。在 npm 安裝期間，OpenClaw 僅驗證鎖定檔限制符合目前主機的已宣告別名。如果 npm 回報成功卻省略該別名，OpenClaw 會使用全新快取重試一次；若別名仍然缺失，則回復此次安裝。

對於非隨附外掛來源，套件安裝期間會強制執行 `openclaw.compat.pluginApi`。請用它指定套件建置時所依據的 OpenClaw 外掛 SDK／執行階段 API 下限。當外掛套件需要較新的 API，但仍為其他流程保留較低的安裝提示時，其限制可以比 `minHostVersion` 更嚴格。依預設，OpenClaw 官方版本同步會將現有官方外掛的 API 下限提升至 OpenClaw 發行版本；但若套件刻意支援較舊主機，僅發布外掛的版本可以保留較低下限。請勿僅以套件版本作為相容性契約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 使用 `openclaw.compat.pluginApi` 契約做出安裝相容性決策。

若外掛已發布至 ClawHub，官方的依需求安裝中繼資料應使用 `clawhubSpec`；新手引導會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品資訊。`npmSpec` 仍是尚未移至 ClawHub 之套件的相容性備援。

精確的 npm 版本固定已位於 `npmSpec`，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確規格與 `expectedIntegrity` 搭配，讓更新流程在所擷取的 npm 成品不再符合固定版本時採取失敗關閉。為維持相容性，互動式新手引導仍會提供受信任登錄中的 npm 規格，包括不含版本的套件名稱與 dist-tag。目錄診斷可以區分精確、浮動、完整性固定、缺少完整性、套件名稱不符與無效的預設選擇來源。若存在 `expectedIntegrity`，卻沒有可供其固定的有效 npm 來源，也會發出警告。存在 `expectedIntegrity` 時，安裝／更新流程會強制執行它；若省略，則會記錄登錄解析結果，但不固定完整性。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定帳號時，頻道外掛應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及可安全用於設定的組態、狀態與密鑰配接器；網路用戶端、閘道接聽器與傳輸執行階段則應保留在主要擴充功能進入點中。

執行階段進入點欄位不會覆寫原始碼進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓逸出套件邊界的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 的適用範圍刻意設得很窄。它不會讓任意損壞的設定變得可安裝。目前它只允許安裝流程從特定的過時隨附外掛升級失敗中復原，例如缺少隨附外掛路徑，或同一隨附外掛存在過時的 `channels.<id>` 項目。不相關的設定錯誤仍會阻止安裝，並引導操作人員使用 `openclaw doctor --fix`。

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

當設定、doctor、狀態或唯讀存在性流程需要在完整頻道外掛載入前，以低成本探查是否存在驗證狀態時，請使用它。持久化驗證狀態並非已設定的頻道狀態：請勿使用此中繼資料自動啟用外掛、修復執行階段相依性，或決定是否應載入頻道執行階段。目標匯出應是僅讀取持久化狀態的小型函式；請勿透過完整頻道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 支援低成本的已設定狀態檢查。當環境變數已足夠時，優先使用宣告式環境中繼資料：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

當列出的每個變數皆為必要時，請使用 `env.allOf`；只要任一非空變數即已足夠時，請使用 `env.anyOf`。如果小型的非執行階段檢查所需資訊超出環境中繼資料，請依 `persistedAuthState` 的示例使用 `specifier` 加上 `exportName`；存在 `env` 時，OpenClaw 無須載入該模組即可使用它。如果檢查需要完整的設定解析或實際頻道執行階段，則應將該邏輯保留在外掛的 `config.hasConfiguredState` 鉤點中。

## 探索優先順序（重複的外掛 ID）

OpenClaw 會從三個根目錄探索外掛，並依此順序檢查：OpenClaw 隨附的外掛、全域安裝根目錄（`~/.openclaw/extensions`）及目前工作區根目錄（`<workspace>/.openclaw/extensions`），再加上任何明確的 `plugins.load.paths` 項目。

如果兩個探索結果共用相同的 `id`，只會保留**優先順序最高**的資訊清單；優先順序較低的重複項目會被捨棄，而不會並列載入。優先順序由高至低如下：

1. **由設定選取** — 在 `plugins.entries.<id>` 中明確固定的路徑
2. **全域安裝且符合追蹤的安裝記錄** — 透過 `openclaw plugin install`/`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤可辨識為相同 ID 的外掛，即使該 ID 也屬於隨附外掛
3. **隨附** — OpenClaw 隨附的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項目

影響：

- 工作區或全域根目錄中未追蹤的隨附外掛分支或過時副本，不會遮蔽隨附的建置版本。
- 若要覆寫隨附外掛，請針對該 id 執行 `openclaw plugin install`，讓已追蹤的全域安裝優先於隨附副本；或透過 `plugins.entries.<id>` 固定特定路徑，使其依設定所選的優先順序勝出。
- 系統會記錄被捨棄的重複項目，讓 Doctor 和啟動診斷能指出遭捨棄的副本。
- 在診斷訊息中，設定所選的重複項目覆寫會明確表述為覆寫，但仍會提出警告，讓過時的分支及意外遮蔽維持可見。

## JSON Schema 要求

- **每個外掛都必須隨附 JSON Schema**，即使不接受任何設定亦然。
- 可以使用空的 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在讀取／寫入設定時驗證，而不是在執行階段驗證。
- 使用新的設定鍵擴充或分支隨附外掛時，請同時更新該外掛的 `openclaw.plugin.json` `configSchema`。隨附外掛的 schema 採嚴格模式，因此若在使用者設定中新增 `plugins.entries.<id>.config.myNewKey`，卻未將 `myNewKey` 加入 `configSchema.properties`，系統會在載入外掛執行階段之前拒絕該設定。

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

- 未知的 `channels.*` 鍵屬於**錯誤**，除非外掛資訊清單已宣告該頻道 id。如果同一 id 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs` 中（即參照了目前無法探索之外掛的情況），OpenClaw 會將其降級為**警告**。
- 若 `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 參照未知的外掛 id，會產生**警告**（「忽略過時的設定項目」），而非錯誤，因此升級及已移除／重新命名的外掛不會阻止閘道啟動。
- 若 `plugins.slots.memory` 參照未知的外掛 id，會產生**錯誤**；但已知的官方外部外掛 `memory-lancedb` 除外，其只會產生警告。
- 如果外掛已安裝，但資訊清單或 schema 損壞或遺失，驗證將會失敗，且 Doctor 會回報外掛錯誤。
- 如果外掛設定存在，但外掛已**停用**，系統會保留設定，並在 Doctor 與記錄中顯示**警告**。

如需完整的 `plugins.*` schema，請參閱[設定參考](/zh-TW/gateway/configuration)。

## 注意事項

- **原生 OpenClaw 外掛必須提供**資訊清單，包括從本機檔案系統載入的外掛。執行階段仍會另外載入外掛模組；資訊清單僅用於探索與驗證。
- 原生資訊清單使用 JSON5 剖析，因此只要最終值仍是物件，即可使用註解、尾隨逗號及未加引號的鍵。
- 資訊清單載入器只會讀取文件記載的資訊清單欄位。請避免使用自訂的頂層鍵。
- 如果外掛不需要，`channels`、`providers`、`cliBackends` 和 `skills` 均可省略。
- `providerCatalogEntry` 必須保持輕量，不應匯入廣泛的執行階段程式碼；請將其用於靜態提供者目錄中繼資料或範圍明確的探索描述元，而非請求期間的執行。
- 互斥的外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 使用 `plugins.slots.memory`（預設為 `memory-core`），`kind: "context-engine"` 使用 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此資訊清單中宣告互斥的外掛種類。執行階段進入點的 `OpenClawPluginDefinition.kind` 已棄用，僅保留作為舊版外掛的相容性備援。
- `setup.providers[].envVars` 中的環境變數中繼資料僅具宣告用途。狀態、稽核、排程傳遞驗證及其他唯讀介面，在將環境變數視為已設定前，仍會套用外掛信任與有效啟用原則。
- 如需必須使用提供者程式碼的執行階段精靈中繼資料，請參閱[提供者執行階段掛鉤](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記錄建置步驟及套件管理器允許清單的任何要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關內容

<CardGroup cols={3}>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="rocket">
    外掛入門指南。
  </Card>
  <Card title="外掛架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概覽" href="/zh-TW/plugins/sdk-overview" icon="book">
    外掛 SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
