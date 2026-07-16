---
read_when:
    - 你正在建置 OpenClaw 外掛
    - 你需要發布外掛設定結構描述或偵錯外掛驗證錯誤
summary: 外掛資訊清單 + JSON 結構描述需求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-16T11:45:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

本頁介紹 **OpenClaw 原生外掛資訊清單** `openclaw.plugin.json`。如需瞭解相容的套件配置（Codex、Claude、Cursor），請參閱[外掛套件](/zh-TW/plugins/bundles)。

相容的套件格式會改用各自的資訊清單檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些配置，但不會依照下方的 `openclaw.plugin.json` 結構描述進行驗證。對於相容的套件，當配置符合 OpenClaw 的執行階段預期時，OpenClaw 會讀取套件中繼資料、宣告的 Skill 根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的鉤子套件。

每個 OpenClaw 原生外掛都**必須**在**外掛根目錄**中提供 `openclaw.plugin.json`。OpenClaw 會讀取此檔案，以便在**不執行外掛程式碼**的情況下驗證設定。資訊清單遺失或無效會阻止設定驗證，並視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需原生能力模型及目前的外部相容性指引，請參閱[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的用途

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。其中所有內容都必須能以足夠低的成本進行檢查，而無須啟動外掛執行階段。

**請用於：**

- 外掛識別、設定驗證及設定 UI 提示
- 驗證、初始設定及設定中繼資料（別名、自動啟用、供應商環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列簡寫的擁有權
- 靜態能力擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併至目錄與驗證介面的頻道專用設定中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼進入點或 npm 安裝中繼資料。這些內容應置於你的外掛程式碼及 `package.json` 中。

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
  "description": "OpenRouter 供應商外掛",
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

| 欄位                                 | 必填     | 類型                         | 意義                                                                                                                                                                                                                                                               |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 標準外掛 ID。這是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                        |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                               |
| `requiresPlugins`                    | 否       | `string[]`                   | 此外掛必須同時安裝才能生效的外掛 ID。探索機制會讓此外掛保持可載入，但若缺少任何必要外掛則會發出警告。                                                                                                               |
| `enabledByDefault`                   | 否       | `true`                       | 將隨附外掛標示為預設啟用。省略此項或設為任何非 `true` 值，即可讓外掛維持預設停用。                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 將隨附外掛標示為僅在列出的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍具有優先權。                                                                                                                                   |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此標準外掛 ID 的舊版 ID。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提及這些提供者 ID 時，應自動啟用此外掛。                                                                                                                                                                            |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告由 `plugins.slots.*` 使用的一或多個互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個位置的外掛會在一個陣列中宣告這兩種種類。                                                                                                    |
| `channels`                           | 否       | `string[]`                   | 此外掛擁有的頻道 ID。用於探索和設定驗證。                                                                                                                                                                                                |
| `providers`                          | 否       | `string[]`                   | 此外掛擁有的提供者 ID。                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | 否       | `string`                     | 相對於外掛根目錄的輕量提供者目錄模組路徑，用於資訊清單範圍內的提供者目錄中繼資料，無須啟用完整外掛執行階段即可載入。                                                                                        |
| `modelSupport`                       | 否       | `object`                     | 資訊清單擁有的模型系列簡寫中繼資料，用於在執行階段之前自動載入外掛。                                                                                                                                                                                |
| `modelCatalog`                       | 否       | `object`                     | 此外掛所擁有之提供者的宣告式模型目錄中繼資料。這是未來在不載入外掛執行階段的情況下，進行唯讀列出、初始設定、模型選擇器、別名和隱藏處理的控制平面合約。                                                |
| `modelPricing`                       | 否       | `object`                     | 提供者擁有的外部定價查詢原則。使用此項可讓本機／自行託管的提供者不使用遠端定價目錄，或將提供者參照對應至 OpenRouter/LiteLLM 目錄 ID，而不必在核心中硬編碼提供者 ID。                                                    |
| `modelIdNormalization`               | 否       | `object`                     | 必須在提供者執行階段載入前執行，由提供者擁有的模型 ID 別名／前綴清理。                                                                                                                                                                                  |
| `providerEndpoints`                  | 否       | `object[]`                   | 資訊清單擁有的端點主機／baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                                                                   |
| `providerRequest`                    | 否       | `object`                     | 通用請求原則在提供者執行階段載入前使用的低成本提供者系列與請求相容性中繼資料。                                                                                                                                                     |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 提供者預設集，讓設定或安裝介面可以提供這些選項，而不必在核心中硬編碼提供者專屬整合。                                                                                                                            |
| `cliBackends`                        | 否       | `string[]`                   | 此外掛擁有的命令列介面推論後端 ID。用於從明確的設定參照在啟動時自動啟用。                                                                                                                                                                |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 在執行階段載入前進行冷啟動模型探索期間，應探測其外掛所擁有之合成驗證鉤子的提供者或命令列介面後端參照。                                                                                                                                     |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 隨附外掛擁有的預留位置 API 金鑰值，代表非機密的本機、OAuth 或環境認證資訊狀態。                                                                                                                                                       |
| `commandAliases`                     | 否       | `object[]`                   | 此外掛擁有的命令名稱，應在執行階段載入前產生可感知外掛的設定與命令列介面診斷資訊。                                                                                                                                                       |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 用於提供者驗證／狀態查詢的已棄用相容性環境變數中繼資料。新外掛請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此項。                                                                                        |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 僅供用量／計費使用的提供者認證資訊。OpenClaw 使用這些名稱探索用量並清除機密資訊，但絕不用於推論驗證。                                                                                                                                  |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 驗證查詢時應重用另一個提供者 ID 的提供者 ID，例如共用基礎提供者 API 金鑰與驗證設定檔的程式設計提供者。                                                                                                                 |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 無須載入外掛程式碼即可檢查的低成本頻道環境變數中繼資料。用於通用啟動／設定輔助工具應能看見、由環境變數驅動的頻道設定或驗證介面。                                                                                   |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於初始設定選擇器、偏好提供者解析和簡易命令列介面旗標連接的低成本驗證選項中繼資料。                                                                                                                                                              |
| `activation`                         | 否       | `object`                     | 用於啟動、提供者、命令、頻道、路由及功能觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由外掛執行階段擁有。                                                                                              |
| `setup`                              | 否       | `object`                     | 探索及設定介面無須載入外掛執行階段即可檢查的低成本設定／初始設定描述元。                                                                                                                                                           |
| `qaRunners`                          | 否       | `object[]`                   | 共用 `openclaw qa` 主機在外掛執行階段載入前使用的低成本 QA 執行器描述元。                                                                                                                                                                             |
| `contracts`                          | 否       | `object`                     | 外部驗證鉤子、嵌入、語音、即時轉錄、即時語音、媒體理解、影像／影片／音樂生成、網頁擷取、網頁搜尋、工作者提供者、文件／網頁內容擷取及工具擁有權的靜態功能擁有權快照。 |
| `configContracts`                    | 否       | `object`                     | 由資訊清單擁有、供通用核心輔助程式使用的設定行為：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑限縮。請參閱 [configContracts 參考資料](#configcontracts-reference)。                                                     |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 適用於 `contracts.mediaUnderstandingProviders` 中所宣告供應商 ID 的低成本媒體理解預設值。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 適用於 `contracts.imageGenerationProviders` 中所宣告供應商 ID 的低成本影像生成驗證中繼資料，包括由供應商擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 適用於 `contracts.videoGenerationProviders` 中所宣告供應商 ID 的低成本影片生成驗證中繼資料，包括由供應商擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 適用於 `contracts.musicGenerationProviders` 中所宣告供應商 ID 的低成本音樂生成驗證中繼資料，包括由供應商擁有的驗證別名與基礎 URL 防護。                                                                                                         |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 適用於 `contracts.tools` 中所宣告、由外掛擁有之工具的低成本可用性中繼資料。若工具在存在設定、環境或驗證證據之前不應載入執行階段，請使用此資料。                                                                                                  |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 由資訊清單擁有的頻道設定中繼資料，會在執行階段載入前合併至探索與驗證介面。                                                                                                                                                                 |
| `skills`                             | 否       | `string[]`                   | 要載入的 Skills 目錄，相對於外掛根目錄。                                                                                                                                                                                                                    |
| `name`                               | 否       | `string`                     | 易於閱讀的外掛名稱。                                                                                                                                                                                                                                                |
| `description`                        | 否       | `string`                     | 顯示於外掛介面的簡短摘要。                                                                                                                                                                                                                                    |
| `catalog`                            | 否       | `object`                     | 外掛目錄介面的選用呈現提示。此中繼資料不會安裝、啟用外掛，也不會授予外掛信任。                                                                                                                                               |
| `icon`                               | 否       | `string`                     | 用於市集／目錄卡片的 HTTPS 影像 URL。ClawHub 接受任何有效的 `https://` URL；若省略此項或其無效，則改用預設外掛圖示。                                                                                                         |
| `version`                            | 否       | `string`                     | 僅供參考的外掛版本。                                                                                                                                                                                                                                              |
| `uiHints`                            | 否       | `Record<string, object>`     | 設定欄位的使用者介面標籤、預留文字與敏感性提示。                                                                                                                                                                                                          |

## 目錄參考

`catalog` 為外掛瀏覽器提供選用的顯示提示。主機可忽略這些提示。這些提示絕不會安裝或啟用外掛，也不會變更其執行階段行為或信任層級。

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
| `featured` | `boolean` | 目錄介面是否應特別展示此外掛。                       |
| `order`    | `number`  | 精選外掛之間的遞增顯示提示；數值越低越早顯示。 |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述相符 `contracts.*GenerationProviders` 清單中所宣告提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具無須匯入每個提供者外掛，即可判斷生成提供者是否可用。

這些欄位僅用於成本低廉的宣告式事實。傳輸、要求轉換、權杖重新整理、認證資訊驗證及實際生成行為仍由外掛執行階段負責。

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

| 欄位                  | 必要 | 類型       | 含義                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 否       | `string[]` | 應視為此生成提供者靜態驗證別名的其他提供者 ID。                                                       |
| `authProviders`        | 否       | `string[]` | 其已設定驗證設定檔應視為此生成提供者驗證依據的提供者 ID。                                                      |
| `configSignals`        | 否       | `object[]` | 適用於無須驗證設定檔或環境變數即可設定之本機或自行託管提供者的低成本、僅設定可用性訊號。                 |
| `authSignals`          | 否       | `object[]` | 明確的驗證訊號。若存在，這些訊號會取代來自提供者 ID、`aliases` 和 `authProviders` 的預設訊號集。                     |
| `referenceAudioInputs` | 否       | `boolean`  | 僅限影片生成。當提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。 |

每個 `configSignals` 項目支援：

| 欄位            | 必要 | 類型       | 含義                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是      | `string`   | 要檢查之外掛所擁有設定物件的點分隔路徑，例如 `plugins.entries.example.config`。                                                                                      |
| `overlayPath`    | 否       | `string`   | 根設定內的點分隔路徑；評估訊號前，該路徑的物件應覆寫根物件。用於 `image`、`video` 或 `music` 等能力專屬設定。   |
| `overlayMapPath` | 否       | `string`   | 根設定內的點分隔路徑；該路徑物件的每個值都應覆寫根物件。用於 `accounts` 等具名帳號對應，其中任何已設定帳號皆應符合資格。 |
| `required`       | 否       | `string[]` | 有效設定內必須具有已設定值的點分隔路徑。字串不得為空；物件與陣列也不得為空。                                                  |
| `requiredAny`    | 否       | `string[]` | 有效設定內至少一個必須具有已設定值的點分隔路徑。                                                                                                    |
| `mode`           | 否       | `object`   | 有效設定內選用的字串模式防護條件。僅當僅有一種模式適用於僅設定可用性時使用。                                                                  |

每個 `mode` 防護條件支援：

| 欄位        | 必要 | 類型       | 含義                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | 否       | `string`   | 有效設定內的點分隔路徑。預設為 `mode`。                          |
| `default`    | 否       | `string`   | 設定省略該路徑時所使用的模式值。                                  |
| `allowed`    | 否       | `string[]` | 若存在，僅當有效模式為這些值之一時，訊號才會通過。 |
| `disallowed` | 否       | `string[]` | 若存在，當有效模式為這些值之一時，訊號會失敗。       |

每個 `authSignals` 項目支援：

| 欄位             | 必要 | 類型     | 含義                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                             |
| `providerBaseUrl` | 否       | `object` | 選用的防護條件，僅在所參照的已設定提供者使用允許的基底 URL 時，才將訊號計入。當驗證別名僅對特定 API 有效時使用。 |

每個 `providerBaseUrl` 防護條件支援：

| 欄位             | 必要 | 類型       | 含義                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string`   | 應檢查其 `baseUrl` 的提供者設定 ID。                                                                                                |
| `defaultBaseUrl`  | 否       | `string`   | 提供者設定省略 `baseUrl` 時要採用的基底 URL。                                                                                         |
| `allowedBaseUrls` | 是      | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設的基底 URL 不符合這些正規化值之一時，會忽略此訊號。 |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 結構，並以工具名稱為索引鍵。`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 無須只為了讓工具工廠傳回 `null` 而匯入外掛執行階段。

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

除了上述共用的 `configSignals`/`authSignals` 欄位之外，`toolMetadata` 項目也接受 `optional`（將工具標示為非外掛啟用必要項目）及 `replaySafe`（將工具執行標示為可在未完成的模型回合後安全重複）。

若工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於其工廠依賴驗證／設定的熱門路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個初始設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此項目。提供者設定清單會使用這些資訊清單選項、由描述元衍生的設定選項及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                                                  | 意義                                                                                                      |
| --------------------- | ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此選項所屬的供應商 ID。                                                                                   |
| `method`              | 是   | `string`                                                              | 要分派至的驗證方法 ID。                                                                                   |
| `choiceId`            | 是   | `string`                                                              | 引導設定與命令列介面流程使用的穩定驗證選項 ID。                                                          |
| `choiceLabel`         | 否   | `string`                                                              | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                       |
| `choiceHint`          | 否   | `string`                                                              | 選擇器的簡短輔助文字。                                                                                    |
| `assistantPriority`   | 否   | `number`                                                              | 在助理驅動的互動式選擇器中，值越小排序越前面。                                                          |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 在助理選擇器中隱藏此選項，同時仍允許透過命令列介面手動選取。                                            |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 應將使用者重新導向至此替代選項的舊版選項 ID。                                                           |
| `groupId`             | 否   | `string`                                                              | 用於將相關選項分組的選用群組 ID。                                                                        |
| `groupLabel`          | 否   | `string`                                                              | 該群組面向使用者的標籤。                                                                                  |
| `groupHint`           | 否   | `string`                                                              | 群組的簡短輔助文字。                                                                                      |
| `onboardingFeatured`  | 否   | `boolean`                                                             | 在互動式引導設定選擇器的精選層級中顯示此群組，位於「More...」項目之前。                                  |
| `optionKey`           | 否   | `string`                                                              | 簡單單旗標驗證流程的內部選項鍵。                                                                          |
| `cliFlag`             | 否   | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                            |
| `cliOption`           | 否   | `string`                                                              | 完整的命令列介面選項形式，例如 `--openrouter-api-key <key>`。                                                      |
| `cliDescription`      | 否   | `string`                                                              | 命令列介面說明中使用的描述。                                                                              |
| `appGuidedSecret`     | 否   | `boolean`                                                             | 一項貼上的密鑰加上供應商預設值，即足以完成應用程式引導的設定。                                          |
| `appGuidedDiscovery`  | 否   | `boolean`                                                             | 相符的執行階段驗證方法透過 `appGuidedSetup` 負責唯讀本機探索。                                        |
| `appGuidedAuth`       | 否   | `"oauth"` \| `"device-code"`                                          | 由供應商擁有、原生設定用戶端可通用呈現的互動式登入。                                                    |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些引導設定介面中。若省略，預設為 `["text-inference"]`。                                |

當 `appGuidedDiscovery` 為 true 時，相符的供應商驗證方法必須公開
`appGuidedSetup.detect` 和 `appGuidedSetup.prepare`。偵測必須為
唯讀：不得登入、提取模型、下載或寫入設定。準備程序會重新檢查
確切選取的模型並傳回設定提案；OpenClaw 會隔離地即時測試該
提案，且僅在成功後提交。

## commandAliases 參考

當外掛擁有一個執行階段命令名稱，而使用者可能誤將其放入 `plugins.allow`，或嘗試將其作為根命令列介面命令執行時，請使用 `commandAliases`。OpenClaw 使用此中繼資料進行診斷，而不匯入外掛執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 意義                                                                    |
| ------------ | ---- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此外掛的命令名稱。                                                  |
| `kind`       | 否   | `"runtime-slash"` | 將別名標記為聊天斜線命令，而非根命令列介面命令。                        |
| `cliCommand` | 否   | `string`          | 若存在，則為命令列介面操作建議的相關根命令列介面命令。                  |

## activation 參考

當外掛能以低成本宣告哪些控制平面事件應將其納入啟用／載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，而非生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證外掛程式碼已執行。啟用規劃器使用這些欄位縮小候選外掛範圍，之後才退回使用現有的資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和鉤子。

優先使用已描述擁有權的最精確中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述項或 `contracts` 能表達該關係時，請使用這些欄位。無法由這些擁有權欄位表示的額外規劃器提示，請使用 `activation`。對於 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅用於尚無擁有權欄位的內嵌代理程式框架 ID。

每個外掛都應有意識地設定 `activation.onStartup`。僅在外掛必須於閘道啟動期間執行時，才將其設為 `true`。若外掛在啟動時處於非作用狀態，且應僅從更精確的觸發條件載入，請將其設為 `false`。省略 `onStartup` 不再會隱含地於啟動時載入外掛；請針對啟動、頻道、設定、代理程式框架、記憶體或其他更精確的啟用觸發條件，使用明確的啟用中繼資料。

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

| 欄位               | 必填 | 類型                                                 | 意義                                                                                                                                                                                        |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的閘道啟動啟用設定。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 則使其保持啟動時延遲載入，除非另一個相符的觸發條件要求載入。 |
| `onProviders`      | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的供應商 ID。                                                                                                                                                   |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的內嵌代理程式框架執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                                                                |
| `onCommands`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的命令 ID。                                                                                                                                                     |
| `onChannels`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的頻道 ID。                                                                                                                                                     |
| `onRoutes`         | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的路由種類。                                                                                                                                                   |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未明確停用時，應將此外掛納入啟動／載入計畫的根目錄相對設定路徑。                                                                                                               |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可能時請優先使用更精確的欄位。                                                                                                                         |

目前的即時取用者：

- 閘道啟動規劃使用 `activation.onStartup` 進行明確的啟動匯入。
- 由命令觸發的命令列介面規劃會回退至舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理程式執行階段啟動規劃對嵌入式測試框架使用 `activation.onAgentHarnesses`，並對命令列介面執行階段別名使用頂層 `cliBackends[]`。
- 由頻道觸發的設定／頻道規劃，在缺少明確的頻道啟用中繼資料時，會回退至舊版 `channels[]` 擁有權。
- 啟動外掛規劃對非頻道根設定介面使用 `activation.onConfigPaths`，例如內建瀏覽器外掛的 `browser` 區塊。
- 由提供者觸發的設定／執行階段規劃，在缺少明確的提供者啟用中繼資料時，會回退至舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權。

規劃器診斷可以區分明確的啟用提示與資訊清單擁有權回退。例如，`activation-command-hint` 表示符合 `activation.onCommands`，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤供主機診斷與測試使用；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當外掛在共用 `openclaw qa` 根目錄下提供一或多個傳輸執行器時，請使用 `qaRunners`。請讓此中繼資料保持低成本且為靜態；外掛
執行階段仍透過輕量的
`runtime-api.ts` 介面擁有實際的命令列介面註冊，該介面會匯出相符的 `qaRunnerCliRegistrations`。選用的
`adapterFactory` 可將傳輸公開給共用的 QA 情境，而不會
變更已註冊命令的執行器。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "針對拋棄式 homeserver 執行以 Docker 為基礎的 Matrix 即時 QA 流程"
    }
  ]
}
```

| 欄位         | 必填 | 類型     | 意義                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是      | `string` | 掛載於 `openclaw qa` 下的子命令，例如 `matrix`。    |
| `description` | 否       | `string` | 共用主機需要預留命令時使用的回退說明文字。 |

`adapterFactory` ID 必須與 `commandName` 相符。請勿為
資訊清單中不存在的命令匯出註冊項目。

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

頂層 `cliBackends` 仍然有效，並持續描述命令列介面推論後端。`setup.cliBackends` 是供控制平面／設定流程使用的設定專用描述元介面，應僅保留中繼資料。

當存在時，`setup.providers` 和 `setup.cliBackends` 是設定探索偏好的描述元優先查詢介面。如果描述元只縮小候選外掛範圍，而設定仍需要更豐富的設定階段執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為回退執行路徑。

OpenClaw 也會在通用提供者驗證與環境變數查詢中納入 `setup.providers[].envVars`。在淘汰期間，仍透過相容性配接器支援 `providerAuthEnvVars`，但仍使用它的非內建外掛會收到資訊清單診斷。新外掛應將設定／狀態環境中繼資料放在 `setup.providers[].envVars`。

當計費或組織層級的認證資訊必須啟用 `resolveUsageAuth`，但不得成為推論認證資訊時，請使用 `providerUsageAuthEnvVars`。這些名稱會納入工作區 dotenv 封鎖、ACP 子行程移除、沙箱機密篩選及廣泛的機密清除。提供者執行階段仍會在 `resolveUsageAuth` 內讀取並分類該值。

當沒有設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 衍生簡單的設定選項。對於自訂標籤、命令列介面旗標、入門引導範圍及助理中繼資料，仍優先使用明確的 `providerAuthChoices` 項目。

只有在這些描述元足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述元合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 進行設定查詢。如果僅描述元外掛仍提供其中一個設定執行階段項目，OpenClaw 會回報附加診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版回退行為，因此已新增描述元但沒有該旗標的現有外掛不會中斷。

由於設定查詢可以執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在所有探索到的外掛中都必須保持唯一。擁有權不明確時會採取封閉式失敗，而不是依探索順序選擇其中一個。

執行設定執行階段時，如果 `setup-api` 註冊了資訊清單描述元未宣告的提供者或命令列介面後端，或描述元沒有相符的執行階段註冊，設定登錄診斷會回報描述元偏差。這些診斷是附加性的，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位          | 必填 | 類型       | 意義                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是      | `string`   | 在設定或入門引導期間公開的提供者 ID。請讓正規化後的 ID 在全域保持唯一。             |
| `authMethods`  | 否       | `string[]` | 此提供者無須載入完整執行階段即可支援的設定／驗證方法 ID。                       |
| `envVars`      | 否       | `string[]` | 通用設定／狀態介面可在外掛執行階段載入前檢查的環境變數。               |
| `authEvidence` | 否       | `object[]` | 對可透過非機密標記驗證的提供者進行低成本本機驗證證據檢查。 |

`authEvidence` 用於提供者擁有、無須載入執行階段程式碼即可驗證的本機認證資訊標記。這些檢查必須保持低成本且僅在本機進行：不得呼叫網路、不得讀取鑰匙圈或機密管理程式、不得執行 Shell 命令，也不得探查提供者 API。

支援的證據項目：

| 欄位              | 必填 | 類型       | 意義                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是      | `string`   | 目前為 `local-file-with-env`。                                                                               |
| `fileEnvVar`       | 否       | `string`   | 包含明確認證資訊檔案路徑的環境變數。                                                           |
| `fallbackPaths`    | 否       | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機認證資訊檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。 |
| `requiresAnyEnv`   | 否       | `string[]` | 必須至少有一個列出的環境變數非空，證據才有效。                                    |
| `requiresAllEnv`   | 否       | `string[]` | 每個列出的環境變數都必須非空，證據才有效。                                           |
| `credentialMarker` | 是      | `string`   | 存在證據時傳回的非機密標記。                                                       |
| `source`           | 否       | `string`   | 用於驗證／狀態輸出的使用者可見來源標籤。                                                               |

### setup 欄位

| 欄位              | 必填 | 類型       | 意義                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在設定與入門引導期間公開的提供者設定描述元。                                     |
| `cliBackends`      | 否       | `string[]` | 用於描述元優先設定查詢的設定階段後端 ID。請讓正規化後的 ID 在全域保持唯一。 |
| `configMigrations` | 否       | `string[]` | 此外掛設定介面擁有的設定遷移 ID。                                          |
| `requiresRuntime`  | 否       | `boolean`  | 描述元查詢後，設定是否仍需要執行 `setup-api`。                            |

## uiHints 參考

`uiHints` 是從設定欄位名稱到小型呈現提示的對應表。鍵可以使用點號表示巢狀設定欄位，但任何路徑區段都不得為 `__proto__`、`constructor` 或 `prototype`；設定會拒絕這些名稱。

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

| 欄位         | 類型       | 意義                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 使用者可見的欄位標籤。                |
| `help`        | `string`   | 簡短的輔助文字。                      |
| `tags`        | `string[]` | 選用的 UI 標籤。                       |
| `advanced`    | `boolean`  | 將欄位標示為進階。            |
| `sensitive`   | `boolean`  | 將欄位標示為機密或敏感。 |
| `placeholder` | `string`   | 表單輸入的預留位置文字。       |

## contracts 參考

僅將 `contracts` 用於 OpenClaw 無須匯入外掛執行階段即可讀取的靜態能力擁有權中繼資料。

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
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任工具執行前原則 ID。隨附外掛無須此欄位即可註冊原則。 |
| `externalAuthProviders`          | `string[]` | 此外掛擁有其外部驗證設定檔掛鉤的供應商 ID。                                                                      |
| `embeddingProviders`             | `string[]` | 此外掛擁有的通用嵌入供應商 ID，用於可重複使用的向量嵌入，包括記憶。                                 |
| `speechProviders`                | `string[]` | 此外掛擁有的語音供應商 ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄供應商 ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音供應商 ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | 此外掛擁有的已棄用記憶專用嵌入供應商 ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解供應商 ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源供應商 ID。                                                                                     |
| `documentExtractors`             | `string[]` | 此外掛擁有的文件（例如 PDF）擷取器供應商 ID。                                                                  |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的影像生成供應商 ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成供應商 ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | 此外掛擁有的音樂生成供應商 ID。                                                                                      |
| `webContentExtractors`           | `string[]` | 此外掛擁有的網頁內容擷取供應商 ID。                                                                           |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取供應商 ID。                                                                                             |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋供應商 ID。                                                                                            |
| `workerProviders`                | `string[]` | 此外掛擁有的雲端工作節點供應商 ID，用於佈建及以設定檔為基礎的租約生命週期。                                      |
| `usageProviders`                 | `string[]` | 此外掛擁有其用量驗證及用量快照掛鉤的供應商 ID。                                                             |
| `migrationProviders`             | `string[]` | 此外掛擁有的匯入供應商 ID，用於 `openclaw migrate`。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | 保留權限，用於在程序內分派閘道方法的已驗證外掛 HTTP 路由。                                  |
| `tools`                          | `string[]` | 此外掛擁有的代理程式工具名稱。                                                                                                   |

`contracts.embeddedExtensionFactories` 保留供隨附且僅限 Codex app-server 的擴充功能工廠使用。隨附的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。已安裝的外掛僅能在明確啟用時使用相同的中介軟體介面，且只能用於其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段。

需要主機受信任工具執行前原則層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機 ID，並明確啟用。隨附外掛保留既有的受信任原則路徑，但具有未宣告原則 ID 的已安裝外掛會在註冊前遭拒絕。原則 ID 的作用域限定於註冊該 ID 的外掛，因此兩個外掛皆可宣告並註冊 `workflow-budget`；單一外掛不得重複註冊相同的本機 ID。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，只載入可能擁有所要求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的供應商外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證掛鉤會被忽略。

同時實作 `resolveUsageAuth` 與 `fetchUsageSnapshot` 的供應商外掛，應在 `contracts.usageProviders` 中宣告每個自動探索的供應商 ID。用量探索會先讀取此合約，再載入執行階段程式碼，然後只載入已宣告的擁有者並驗證兩個掛鉤。

通用嵌入供應商應針對每個以 `api.registerEmbeddingProvider(...)` 註冊的配接器宣告 `contracts.embeddingProviders`。可重複使用的向量生成應使用通用合約，包括供記憶搜尋使用的供應商。`contracts.memoryEmbeddingProviders` 是已棄用的記憶專用相容性機制，僅在現有供應商移轉至通用嵌入供應商介面期間保留。

工作節點供應商必須在 `contracts.workerProviders` 中宣告每個 `api.registerWorkerProvider(...)` ID。核心會在呼叫 `provision` 前持久保存意圖；供應商會在外部分配前驗證其設定，而使用相同作業 ID 的重複呼叫必須採用相同租約。核心也會持久保存已驗證的設定快照，並將其與 `leaseId` 一併傳遞給 `inspect({ leaseId, profile })` 和 `destroy({ leaseId, profile })`，即使具名設定檔之後已變更或移除亦同。銷毀具有冪等性，檢查會傳回封閉的 `active` / `destroyed` / `unknown` 狀態聯集，而 SSH 私密金鑰資料僅透過 `SecretRef` 參照。佈建的 SSH 端點也必須包含來自受信任佈建輸出的公開 `hostKey`，其格式必須恰為 `algorithm base64`，不得包含主機名稱或註解，以便核心在連線前固定主機。建立動態身分參照的供應商可實作具權威性的 `resolveSshIdentity({ leaseId, profile, keyRef })`；未實作的供應商則使用核心的通用密鑰解析器。具權威性的 `unknown` 會使作用中的本機記錄成為孤立記錄；在持久保存銷毀要求後，它會確認拆除完成。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。這是原生外掛 HTTP 路由的 API 衛生閘門，適用於刻意在程序內分派閘道控制平面方法的路由；它並非用來防範惡意原生外掛的沙箱。僅應用於已經要求閘道 HTTP 驗證，且經嚴格審查的隨附／操作員介面。當閘道根工作准入關閉時，具有權限的路由僅在同時宣告 `auth: "gateway"` 及路由專屬的 `gatewayRuntimeScopeSurface: "trusted-operator"` 時仍可存取；同一外掛的一般同層路由仍位於准入邊界之後。如此可讓暫停狀態與恢復功能保持可存取，而無須授予整個外掛略過准入的權限。分派以外的剖析與回應塑形應維持有限範圍；實質性或會變更狀態的工作必須透過閘道方法分派執行，由其負責准入與作用域強制執行。

## configContracts 參考

對於由資訊清單擁有、且通用核心輔助程式需要在不匯入外掛執行階段的情況下使用的設定行為，請使用 `configContracts`：危險旗標偵測、SecretRef 移轉目標，以及舊版設定路徑縮限。

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

| 欄位                         | 必填 | 類型       | 意義                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否       | `string[]` | 表示此外掛的設定階段相容性移轉可能適用的根目錄相對設定路徑。當設定從未參照此外掛時，可讓通用執行階段設定讀取略過所有外掛設定介面。                 |
| `compatibilityRuntimePaths`   | 否       | `string[]` | 此外掛可在外掛程式碼完全啟用前，於執行階段處理的根目錄相對相容性路徑。用於應縮小隨附候選集合，而不匯入每個相容外掛執行階段的舊版介面。 |
| `dangerousFlags`              | 否       | `object[]` | 啟用時，`openclaw doctor` 應標示為不安全或危險的設定常值。請參閱下文。                                                                                                                                   |
| `secretInputs`                | 否       | `object`   | `plugins.entries.<id>.config` 下方的設定路徑，SecretRef 移轉／稽核目標登錄應將其視為密鑰形式的字串。請參閱下文。                                                                                  |

每個 `dangerousFlags` 項目支援：

| 欄位    | 必填 | 類型                                  | 意義                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | 是      | `string`                              | 相對於 `plugins.entries.<id>.config`、以點號分隔的設定路徑。支援對映／陣列區段使用 `*` 萬用字元。 |
| `equals` | 是      | `string \| number \| boolean \| null` | 將此設定值標示為危險的精確常值。                                                            |

`secretInputs` 支援：

| 欄位                   | 必填 | 類型       | 說明                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否       | `boolean`  | 決定此 SecretRef 介面是否啟用時，覆寫內建外掛的預設啟用狀態。當外掛已內建，但此介面應維持停用，直到在設定中明確啟用時，請使用此欄位。 |
| `paths`                 | 是      | `object[]` | 機密資料形式的設定路徑，每個路徑都有 `path`（以點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元），以及選用的 `expected`（目前僅支援 `"string"`）。                            |

## mediaUnderstandingProviderMetadata 參考

當媒體理解供應商具有預設模型、自動驗證備援優先順序，或通用核心輔助工具在執行階段載入前所需的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。金鑰也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

| 欄位                  | 類型                                                             | 說明                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此供應商提供的媒體功能。                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | 設定未指定模型時使用的功能對應模型預設值。                                         |
| `autoPriority`         | `Record<string, number>`                                         | 依認證資訊自動進行供應商備援時，數字越小排序越前面。                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 供應商支援的原生文件輸入。                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 各文件類型的模型覆寫。將 `image: false` 設為停用該文件類型以影像為基礎的擷取。 |

## channelConfigs 參考

當頻道外掛需要在執行階段載入前取得低成本的設定中繼資料時，請使用 `channelConfigs`。若沒有設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段，唯讀的頻道設定／狀態探索可直接對已設定的外部頻道使用此中繼資料。

`channelConfigs` 是外掛資訊清單中繼資料，而不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定頻道執行個體。OpenClaw 會讀取資訊清單中繼資料，以在外掛執行階段程式碼執行前判斷哪個外掛擁有該已設定頻道。

對於頻道外掛，`configSchema` 與 `channelConfigs` 描述不同的路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非內建外掛也應宣告相符的 `channelConfigs` 項目。若未宣告，OpenClaw 仍可載入該外掛，但冷路徑設定結構描述、設定流程與 Control UI 介面在外掛執行階段執行前無法得知該頻道所擁有的選項結構。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 與 `nativeSkillsAutoEnabled` 可宣告靜態 `auto` 預設值，供頻道執行階段載入前執行的命令設定檢查使用。內建頻道也可透過 `package.json#openclaw.channel.commands`，連同其套件所擁有的其他頻道目錄中繼資料，發布相同的預設值。

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

| 欄位         | 類型                     | 說明                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的頻道設定項目都必須提供。         |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤／預留位置／敏感資料提示。          |
| `label`       | `string`                 | 執行階段中繼資料尚未就緒時，合併至選擇器與檢查介面的頻道標籤。 |
| `description` | `string`                 | 用於檢查與目錄介面的簡短頻道說明。                               |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。       |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於的舊版或較低優先順序外掛 ID。    |

### 取代另一個頻道外掛

當你的外掛是某個頻道 ID 的首選擁有者，而另一個外掛也能提供該頻道時，請使用 `preferOver`。常見情況包括外掛 ID 已重新命名、獨立外掛取代內建外掛，或維護中的分支為了設定相容性而保留相同頻道 ID。

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

設定 `channels.chat` 後，OpenClaw 會同時考量頻道 ID 與首選外掛 ID。若較低優先順序的外掛僅因為是內建外掛或預設啟用而被選取，OpenClaw 會在有效的執行階段設定中停用它，使一個外掛擁有該頻道及其工具。明確的使用者選擇仍具有優先權：若使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇並回報重複的頻道／工具診斷，而不會默默變更所要求的外掛集合。

請將 `preferOver` 限定於確實能提供相同頻道的外掛 ID。它不是一般優先順序欄位，也不會重新命名使用者設定金鑰。

## modelSupport 參考

當 OpenClaw 應在外掛執行階段載入前，從 `gpt-5.6-sol` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷你的供應商外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 採用以下優先順序：

- 明確的 `provider/model` 參照會使用所屬 `providers` 資訊清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 若一個非內建外掛與一個內建外掛皆符合，則非內建外掛優先
- 其餘歧義會被忽略，直到使用者或設定指定供應商

欄位：

| 欄位           | 類型       | 說明                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 比對簡寫模型 ID 的前綴。                 |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，與簡寫模型 ID 比對的規則運算式來源。 |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯，此工具會拒絕包含巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被直接略過，處理方式與語法無效的規則運算式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考

當 OpenClaw 應在載入外掛執行階段前得知供應商模型中繼資料時，請使用 `modelCatalog`。這是固定目錄資料列、供應商別名、抑制規則與探索模式由資訊清單擁有的來源。執行階段重新整理仍由供應商執行階段程式碼負責，但資訊清單會告知核心何時需要執行階段。

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
        "reason": "Azure OpenAI Responses 不提供此模型"
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
| `providers`      | `Record<string, object>`                                 | 此外掛所擁有之提供者 ID 的目錄資料列。索引鍵也應出現在頂層 `providers` 中。       |
| `aliases`        | `Record<string, object>`                                 | 在規劃目錄或抑制項目時，應解析為所擁有提供者的提供者別名。              |
| `suppressions`   | `object[]`                                               | 此外掛基於提供者特定原因而抑制的其他來源模型資料列。                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄能否從資訊清單中繼資料讀取、重新整理至快取，或需要執行階段。 |
| `runtimeAugment` | `boolean`                                                | 僅當提供者執行階段必須在資訊清單／設定規劃後附加目錄資料列時，才設為 `true`。       |

`aliases` 會參與模型目錄規劃的提供者擁有權查詢。別名目標必須是同一外掛所擁有的頂層提供者。當依提供者篩選的清單使用別名時，OpenClaw 可讀取擁有者的資訊清單，並套用別名的 API／基礎 URL 覆寫，而不載入提供者執行階段。別名不會展開未篩選的目錄清單；廣泛清單只會輸出擁有者的標準提供者資料列。

`suppressions` 取代舊有的提供者執行階段 `suppressBuiltInModel` 鉤子。僅當提供者由此外掛擁有，或宣告為指向所擁有提供者的 `modelCatalog.aliases` 索引鍵時，才會採用抑制項目。模型解析期間不再呼叫執行階段抑制鉤子。

提供者欄位：

| 欄位                 | 類型                     | 含義                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | 此提供者目錄中模型的選用預設基礎 URL。                                                                                                                                                    |
| `api`                 | `ModelApi`               | 此提供者目錄中模型的選用預設 API 轉接器。                                                                                                                                                 |
| `headers`             | `Record<string, string>` | 套用至此提供者目錄的選用靜態標頭。                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | 提供者建議用於簡短內部公用任務（標題、進度敘述）的選用小型模型 ID。當 `agents.defaults.utilityModel` 未設定，且此提供者供應代理程式的主要模型時使用。 |
| `models`              | `object[]`               | 必要的模型資料列。缺少 `id` 的資料列會被忽略。                                                                                                                                                            |

模型欄位：

| 欄位              | 類型                                                           | 含義                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供者本機模型 ID，不含 `provider/` 前置詞。                    |
| `name`             | `string`                                                       | 選用的顯示名稱。                                                      |
| `api`              | `ModelApi`                                                     | 選用的個別模型 API 覆寫。                                            |
| `baseUrl`          | `string`                                                       | 選用的個別模型基礎 URL 覆寫。                                       |
| `headers`          | `Record<string, string>`                                       | 選用的個別模型靜態標頭。                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被無提示地捨棄。            |
| `reasoning`        | `boolean`                                                      | 模型是否提供推理行為。                               |
| `contextWindow`    | `number`                                                       | 提供者原生的上下文視窗。                                             |
| `contextTokens`    | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段上下文上限。 |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出權杖數。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的各思考層級模型 ID 或參數覆寫。                    |
| `cost`             | `object`                                                       | 選用的每百萬權杖美元定價，包含選用的 `tieredPricing`。 |
| `compat`           | `object`                                                       | 符合 OpenClaw 模型設定相容性的選用相容性旗標。  |
| `mediaInput`       | `object`                                                       | 選用的各模態輸入設定，目前僅支援影像。                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 清單狀態。僅當資料列完全不應出現時才抑制。          |
| `statusReason`     | `string`                                                       | 與非可用狀態一同顯示的選用原因。                            |
| `replaces`         | `string[]`                                                     | 此模型取代的較舊提供者本機模型 ID。                       |
| `replacedBy`       | `string`                                                       | 已棄用資料列的替代提供者本機模型 ID。                    |
| `tags`             | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                    |

抑制欄位：

| 欄位                      | 類型       | 含義                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制之上游資料列的提供者 ID。必須由此外掛擁有，或宣告為所擁有的別名。 |
| `model`                    | `string`   | 要抑制的提供者本機模型 ID。                                                                      |
| `reason`                   | `string`   | 直接要求受抑制資料列時顯示的選用訊息。                                     |
| `when.baseUrlHosts`        | `string[]` | 套用抑制前所需的有效提供者基礎 URL 主機選用清單。               |
| `when.providerConfigApiIn` | `string[]` | 套用抑制前所需的完全相符提供者設定 `api` 值選用清單。              |

請勿將僅限執行階段的資料放入 `modelCatalog`。僅當資訊清單資料列足夠完整，使依提供者篩選的清單與選擇器介面能略過登錄／執行階段探索時，才使用 `static`。當資訊清單資料列可作為實用且可列出的種子或補充項目，但稍後重新整理／快取可新增更多資料列時，使用 `refreshable`；可重新整理的資料列本身並非權威來源。當 OpenClaw 必須載入提供者執行階段才能得知清單時，使用 `runtime`。

## modelIdNormalization 參考

針對必須在提供者執行階段載入前執行、成本低廉且由提供者擁有的模型 ID 清理，使用 `modelIdNormalization`。這會將短模型名稱、提供者本機舊版 ID，以及 Proxy 前置詞規則等別名保留在擁有者外掛的資訊清單中，而非核心模型選擇表中。

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

| 欄位                                | 類型                    | 含義                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的完全相符模型 ID 別名。傳回的值會保持原樣。                  |
| `stripPrefixes`                      | `string[]`              | 在別名查詢前移除的前置詞，適用於舊版提供者／模型重複情況。     |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時，要新增的前置詞。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查詢後的條件式裸 ID 前置詞規則，以 `modelPrefix` 和 `prefix` 為索引鍵。 |

## providerEndpoints 參考

針對通用請求政策必須在提供者執行階段載入前得知的端點分類，使用 `providerEndpoints`。核心仍擁有每個 `endpointClass` 的含義；外掛資訊清單擁有主機與基礎 URL 中繼資料。

正式外部化的提供者外掛不包含在核心發行版中，因此
安裝前無法看到其資訊清單。其 `providerEndpoints` 也必須
鏡像至 `scripts/lib/official-external-provider-catalog.json`，以便
在沒有外掛時端點分類仍可運作；契約測試會
強制執行此鏡像。

端點欄位：

| 欄位                          | 類型       | 含義                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 對應至該端點類別的完整主機名稱。                                                |
| `hostSuffixes`                 | `string[]` | 對應至該端點類別的主機尾碼。若只要比對網域尾碼，請加上 `.` 前綴。 |
| `baseUrls`                     | `string[]` | 對應至該端點類別且經正規化的完整 HTTP(S) 基底 URL。                             |
| `googleVertexRegion`           | `string`   | 完整全域主機的靜態 Google Vertex 區域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的尾碼，以顯露 Google Vertex 區域前綴。                 |

## providerRequest 參考資料

當通用請求原則需要成本低廉的請求相容性中繼資料，且不應載入供應商執行階段時，請使用 `providerRequest`。請將特定行為的承載資料改寫保留在供應商執行階段掛鉤或共用的供應商系列輔助程式中。

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

| 欄位                 | 類型         | 含義                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用請求相容性判斷和診斷所使用的供應商系列標籤。 |
| `compatibilityFamily` | `"moonshot"` | 供共用請求輔助程式使用的選用供應商系列相容性分類。              |
| `openAICompletions`   | `object`     | OpenAI 相容的 completions 請求旗標，目前為 `supportsStreamingUsage`。       |

## secretProviderIntegrations 參考資料

當外掛可發布可重複使用的 SecretRef exec 供應商預設時，請使用 `secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料、將外掛擁有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際的秘密解析交由 SecretRef 執行階段處理。預設僅會向內建外掛，以及從受管理的外掛安裝根目錄中找到的已安裝外掛公開，例如透過 git 和 ClawHub 安裝的外掛。

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

對應表的鍵是整合 ID。如果省略 `providerAlias`，OpenClaw 會使用整合 ID 作為 SecretRef 供應商別名。供應商別名必須符合一般的 SecretRef 供應商別名模式，例如 `team-secrets` 或 `onepassword-work`。

當操作者選取此預設時，OpenClaw 會寫入如下的供應商參照：

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

在啟動或重新載入時，OpenClaw 會載入目前的外掛資訊清單中繼資料、檢查擁有此外掛是否已安裝且為啟用狀態，並從資訊清單具現化 exec 命令，以解析該供應商。停用或移除外掛會撤銷作用中 SecretRef 對該供應商的使用權。希望使用獨立 exec 設定的操作者，仍可直接手動寫入 `command`/`args` 供應商。

目前僅支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]` 必須是相對於 `./` 外掛根目錄的解析器指令碼。OpenClaw 會在啟動或重新載入時，將其具現化為目前的 Node 可執行檔，以及外掛內指令碼的絕對路徑。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 選項不屬於資訊清單預設合約。需要非 Node 命令的操作者，可直接設定獨立的手動 exec 供應商。

OpenClaw 會根據外掛根目錄為資訊清單預設衍生 `trustedDirs`，而對於 `${node}` 預設，還會使用目前的 Node 可執行檔目錄。資訊清單中撰寫的 `trustedDirs` 會被忽略。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath` 等其他 exec 供應商選項，會原樣傳遞至一般的 SecretRef exec 供應商設定。

## modelPricing 參考資料

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

| 欄位        | 類型              | 含義                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對永遠不應擷取 OpenRouter 或 LiteLLM 定價的本機／自行託管供應商，設定 `false`。 |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此供應商的 OpenRouter 查詢。           |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此供應商的 LiteLLM 查詢。                 |

來源欄位：

| 欄位                      | 類型               | 含義                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄供應商 ID 與 OpenClaw 供應商 ID 不同時所使用的 ID，例如 `zai` 供應商使用的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 將含斜線的模型 ID 視為巢狀的供應商／模型參照，適用於 OpenRouter 等代理供應商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的點號版本 ID。            |

### OpenClaw 供應商索引

OpenClaw 供應商索引是由 OpenClaw 擁有的預覽中繼資料，用於外掛可能尚未安裝的供應商。它不屬於外掛資訊清單。外掛資訊清單仍是已安裝外掛的權威來源。供應商索引是內部備援合約；當供應商外掛尚未安裝時，未來可安裝供應商及安裝前模型選擇器介面將使用此合約。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛資訊清單 `modelCatalog`。
3. 透過明確重新整理取得的模型目錄快取。
4. OpenClaw 供應商索引預覽資料列。

供應商索引不得包含秘密、啟用狀態、執行階段掛鉤或即時的帳號特定模型資料。其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 供應商資料列形狀，但應僅限於穩定的顯示中繼資料，除非有意讓 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位與已安裝外掛資訊清單保持一致。具備即時 `/models` 探索功能的供應商，應透過明確的模型目錄快取路徑寫入重新整理後的資料列，而不是讓一般清單顯示或引導流程呼叫供應商 API。

對於外掛已移出核心或尚未安裝的供應商，供應商索引項目也可包含可安裝外掛的中繼資料。此中繼資料仿照通道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及成本低廉的驗證方式選項標籤，已足以顯示可安裝的設定選項。外掛安裝後，其資訊清單具有優先權，且該供應商的供應商索引項目會被忽略。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層資訊清單功能鍵遷移至 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些欄位（或任何其他功能清單）都不再作為頂層資訊清單欄位讀取；一般資訊清單載入只會辨識 `contracts` 下的這些欄位。

## 資訊清單與 package.json 的比較

這兩個檔案各自負責不同工作：

| 檔案                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證方式選項中繼資料，以及必須在外掛程式碼執行前存在的 UI 提示                         |
| `package.json`         | npm 中繼資料、相依套件安裝，以及用於進入點、安裝閘門、設定或目錄中繼資料的 `openclaw` 區塊 |

如果不確定某項中繼資料應放在哪裡，請使用以下規則：

- 如果 OpenClaw 必須在載入外掛程式碼前知道它，請將它放入 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請將它放入 `package.json`

### 影響探索的 package.json 欄位

某些執行階段前的外掛中繼資料會刻意放在 `package.json` 的 `openclaw` 區塊下，而不是 `openclaw.plugin.json` 中。`openclaw.bundle` 和 `openclaw.bundle.json` 並非 OpenClaw 外掛合約；原生外掛必須使用 `openclaw.plugin.json`，以及下方支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                      | 意義                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須保留在外掛套件目錄內。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須保留在外掛套件目錄內。                                                                 |
| `openclaw.setupEntry`                                                                      | 僅供設定使用的輕量進入點，用於初始設定、延後啟動頻道，以及唯讀頻道狀態／SecretRef 探索。必須保留在外掛套件目錄內。 |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的建置後 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須保留在外掛套件目錄內。                         |
| `openclaw.channel`                                                                         | 輕量頻道目錄中繼資料，例如標籤、文件路徑、別名及選取說明。                                                                                                 |
| `openclaw.channel.commands`                                                                | 在頻道執行階段載入前，由設定、稽核及命令清單介面使用的靜態原生命令與原生 skill 自動預設中繼資料。                                          |
| `openclaw.channel.configuredState`                                                         | 輕量已設定狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已存在僅使用環境變數的設定？」                                         |
| `openclaw.channel.persistedAuthState`                                                      | 輕量持久化驗證檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已有任何登入狀態？」                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 內建及外部發布外掛的安裝／更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 有多個安裝來源可用時的偏好安裝路徑。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | 支援的最低 OpenClaw 主機版本，使用如 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                             |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用如 `>=2026.5.27` 的 semver 下限。                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝及更新流程會依此驗證擷取的成品。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定無效時，允許使用範圍有限的內建外掛重新安裝復原路徑。                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | 當鎖定檔的平台限制符合目前主機時，必須具體安裝的 npm 套件別名。                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 讓設定執行階段的頻道介面可在開始監聽前載入，接著將完整的已設定頻道外掛延後至監聽後啟用。                                                 |

資訊清單中繼資料會決定執行階段載入前，初始設定中會顯示哪些供應商／頻道／設定選項。`package.json#openclaw.install` 會告知初始設定流程，當使用者選擇其中一個選項時，如何擷取或啟用該外掛。請勿將安裝提示移至 `openclaw.plugin.json`。

對於非內建外掛來源，安裝及資訊清單登錄載入期間會強制執行 `openclaw.install.minHostVersion`。無效值會遭拒絕；較新但有效的值會使較舊主機略過外部外掛。內建來源外掛會假設與主機簽出版本同步。

`openclaw.install.requiredPlatformPackages` 適用於透過選用且限定平台的別名公開必要原生二進位檔的 npm 套件。請列出每個支援平台別名的純 npm 套件名稱。npm 安裝期間，OpenClaw 只會驗證鎖定檔限制符合目前主機的已宣告別名。若 npm 回報成功卻省略該別名，OpenClaw 會使用全新快取重試一次；若別名仍缺少，則復原安裝。

對於非內建外掛來源，套件安裝期間會強制執行 `openclaw.compat.pluginApi`。請用它指定套件建置所依據的 OpenClaw 外掛 SDK／執行階段 API 下限。當外掛套件需要較新的 API，但仍為其他流程保留較低的安裝提示時，它可以比 `minHostVersion` 更嚴格。官方 OpenClaw 發行同步預設會將現有官方外掛 API 下限提升至 OpenClaw 發行版本，但若套件刻意支援較舊主機，僅發布外掛的版本仍可保留較低下限。請勿僅以套件版本作為相容性合約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 使用 `openclaw.compat.pluginApi` 合約進行安裝相容性判斷。

若外掛已發布至 ClawHub，官方的按需安裝中繼資料應使用 `clawhubSpec`；初始設定會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品資訊。`npmSpec` 仍是尚未遷移至 ClawHub 之套件的相容性備援選項。

精確的 npm 版本固定已存在於 `npmSpec`，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確規格與 `expectedIntegrity` 配對，讓更新流程在擷取的 npm 成品不再符合固定版本時採取封閉式失敗。為維持相容性，互動式初始設定仍會提供受信任登錄中的 npm 規格，包括純套件名稱及 dist-tag。目錄診斷可區分精確、浮動、已固定完整性、缺少完整性、套件名稱不符及無效預設選項來源。若存在 `expectedIntegrity`，卻沒有可供其固定的有效 npm 來源，也會發出警告。存在 `expectedIntegrity` 時，安裝／更新流程會強制執行它；省略時則會記錄登錄解析結果，但不固定完整性。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定帳號時，頻道外掛應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及可安全用於設定的組態、狀態及祕密轉接器；網路用戶端、閘道監聽器及傳輸執行階段則應保留在主要擴充功能進入點中。

執行階段進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓逸出邊界的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 的範圍刻意設得很窄。它不會讓任意損壞的設定變得可安裝。目前僅允許安裝流程從特定的過時內建外掛升級失敗中復原，例如缺少內建外掛路徑，或同一內建外掛存在過時的 `channels.<id>` 項目。無關的設定錯誤仍會阻擋安裝，並將操作人員引導至 `openclaw doctor --fix`。

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

當設定、doctor、狀態或唯讀存在狀態流程需要在完整頻道外掛載入前，進行低成本的是／否驗證探查時使用它。持久化驗證狀態並非已設定的頻道狀態：請勿使用此中繼資料自動啟用外掛、修復執行階段相依性，或決定是否應載入頻道執行階段。目標匯出項目應為只讀取持久化狀態的小型函式；請勿透過完整頻道執行階段的 barrel 導出它。

`openclaw.channel.configuredState` 支援低成本的設定狀態檢查。若環境變數已足夠，應優先使用宣告式環境中繼資料：

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

當列出的每個變數都是必要項目時使用 `env.allOf`；只要任一非空白變數便已足夠時，則使用 `env.anyOf`。若微型非執行階段檢查需要環境中繼資料以外的資訊，請像 `persistedAuthState` 所示使用 `specifier` 加上 `exportName`；存在 `env` 時，OpenClaw 會直接使用它而不載入該模組。若檢查需要完整設定解析或真正的頻道執行階段，則應將該邏輯保留在外掛的 `config.hasConfiguredState` 鉤點中。

## 探索優先順序（重複的外掛 ID）

OpenClaw 會從三個根目錄探索外掛，並依下列順序檢查：隨 OpenClaw 提供的內建外掛、全域安裝根目錄（`~/.openclaw/extensions`）及目前工作區根目錄（`<workspace>/.openclaw/extensions`），再加上任何明確的 `plugins.load.paths` 項目。

若兩個探索結果具有相同的 `id`，只會保留優先順序**最高**的資訊清單；優先順序較低的重複項目會遭捨棄，而不會並列載入。優先順序由高至低如下：

1. **設定選定** — 在 `plugins.entries.<id>` 中明確固定的路徑
2. **符合受追蹤安裝記錄的全域安裝** — 透過 `openclaw plugin install`/`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤針對相同 ID 可辨識的外掛，即使該 ID 也屬於內建外掛
3. **內建** — 隨 OpenClaw 提供的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項目

影響如下：

- 位於工作區或全域根目錄中、未受追蹤的內建外掛分支版本或過時副本，不會遮蔽內建版本。
- 若要覆寫內建外掛，請針對該 ID 執行 `openclaw plugin install`，讓受追蹤的全域安裝優先於內建副本；或透過 `plugins.entries.<id>` 固定特定路徑，使其以設定選定的優先順序勝出。
- 重複項目遭捨棄時會記錄日誌，讓 Doctor 與啟動診斷可指出被捨棄的副本。
- 設定選定的重複覆寫在診斷中會表述為明確覆寫，但仍會發出警告，讓過時分支版本與意外遮蔽保持可見。

## JSON Schema 要求

- **每個外掛都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空的結構描述也可以接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- 結構描述會在讀取／寫入設定時驗證，而不是在執行階段驗證。
- 使用新的設定鍵擴充或分支內建外掛時，請同時更新該外掛的 `openclaw.plugin.json` `configSchema`。內建外掛的結構描述採嚴格模式，因此若在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，卻未將 `myNewKey` 加入 `configSchema.properties`，系統會在載入外掛執行階段之前拒絕該設定。

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

- 未知的 `channels.*` 鍵屬於**錯誤**，除非該頻道 ID 已由外掛資訊清單宣告。如果相同 ID 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs`（已參照但目前無法探索到的外掛）中，OpenClaw 會改將其降級為**警告**。
- 若 `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 參照未知的外掛 ID，則屬於**警告**（「已忽略過時的設定項目」），而不是錯誤，因此升級或移除／重新命名外掛不會阻止閘道啟動。
- 若 `plugins.slots.memory` 參照未知的外掛 ID，則屬於**錯誤**；但已知的官方外部外掛 `memory-lancedb` 除外，此情況只會發出警告。
- 如果外掛已安裝，但其資訊清單或結構描述損壞或遺失，驗證將失敗，Doctor 也會回報外掛錯誤。
- 如果外掛設定存在，但外掛已**停用**，系統會保留設定，並在 Doctor 與記錄中顯示**警告**。

如需完整的 `plugins.*` 結構描述，請參閱[設定參考](/zh-TW/gateway/configuration)。

## 注意事項

- **原生 OpenClaw 外掛必須提供資訊清單**，包括從本機檔案系統載入的外掛。執行階段仍會另外載入外掛模組；資訊清單僅用於探索與驗證。
- 原生資訊清單使用 JSON5 剖析，因此只要最終值仍為物件，即可使用註解、尾隨逗號及未加引號的鍵。
- 資訊清單載入器只會讀取有文件說明的資訊清單欄位。請避免使用自訂的頂層鍵。
- 外掛不需要時，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerCatalogEntry` 必須維持輕量，不應匯入廣泛的執行階段程式碼；請將它用於靜態供應商目錄中繼資料或範圍明確的探索描述項，而非要求處理期間的執行。
- 互斥外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`（預設為 `memory-core`），`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此資訊清單中宣告互斥外掛種類。執行階段進入點的 `OpenClawPluginDefinition.kind` 已淘汰，僅保留作為舊版外掛的相容性備援。
- 環境變數中繼資料（`setup.providers[].envVars`、已淘汰的 `providerAuthEnvVars`，以及 `channelEnvVars`）僅具宣告性。在將環境變數視為已設定之前，狀態、稽核、排程傳遞驗證及其他唯讀介面仍會套用外掛信任與有效啟用政策。
- 如需依賴供應商程式碼的執行階段精靈中繼資料，請參閱[供應商執行階段掛鉤](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記錄建置步驟及所有套件管理器允許清單要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關內容

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
