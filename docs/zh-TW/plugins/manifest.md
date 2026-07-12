---
read_when:
    - 你正在建構 OpenClaw 外掛
    - 你需要發布外掛設定結構描述或偵錯外掛驗證錯誤
summary: 外掛資訊清單與 JSON schema 要求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-07-12T14:43:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

本頁說明 **OpenClaw 原生外掛資訊清單** `openclaw.plugin.json`。如需瞭解相容的套件配置（Codex、Claude、Cursor），請參閱[外掛套件](/zh-TW/plugins/bundles)。

相容的套件格式會改用各自的資訊清單檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 會自動偵測這些配置，但不會使用下方的 `openclaw.plugin.json` 結構描述進行驗證。對於相容套件，當其配置符合 OpenClaw 的執行階段預期時，OpenClaw 會讀取套件中繼資料、宣告的 skill 根目錄、Claude 命令根目錄、Claude `settings.json` 預設值、Claude LSP 預設值，以及支援的鉤子套件。

每個原生 OpenClaw 外掛都**必須**在**外掛根目錄**中提供 `openclaw.plugin.json`。OpenClaw 會讀取此檔案，以便在**不執行外掛程式碼**的情況下驗證設定。資訊清單缺失或無效會阻止設定驗證，並視為外掛錯誤。

如需完整的外掛系統指南，請參閱[外掛](/zh-TW/tools/plugin)；如需原生能力模型與目前的外部相容性指南，請參閱[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的用途

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。其中所有內容都必須能以足夠低的成本進行檢查，而不必啟動外掛執行階段。

**用於：**

- 外掛識別、設定驗證與設定使用者介面提示
- 驗證、初始設定與安裝中繼資料（別名、自動啟用、提供者環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列簡寫的擁有權
- 靜態能力擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併至目錄與驗證介面的頻道專用設定中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼進入點或 npm 安裝中繼資料。這些內容應放在你的外掛程式碼與 `package.json` 中。

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

## 頂層欄位參考資料

| 欄位                                 | 必填     | 類型                         | 意義                                                                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 標準外掛 ID。這是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                                     |
| `configSchema`                       | 是       | `object`                     | 此外掛設定的行內 JSON Schema。                                                                                                                                                                                                                                             |
| `requiresPlugins`                    | 否       | `string[]`                   | 此外掛要生效時也必須安裝的外掛 ID。探索程序仍會讓此外掛可載入，但缺少任何必要外掛時會發出警告。                                                                                                                                                                             |
| `enabledByDefault`                   | 否       | `true`                       | 將內建外掛標記為預設啟用。省略此欄位或設為任何非 `true` 值，即可讓此外掛預設保持停用。                                                                                                                                                                                       |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 將內建外掛標記為僅在列出的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍具有優先權。                                                                                                                                                                                |
| `legacyPluginIds`                    | 否       | `string[]`                   | 會正規化為此標準外掛 ID 的舊版 ID。                                                                                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 當驗證、設定或模型參照提及這些提供者 ID 時，應自動啟用此外掛。                                                                                                                                                                                                             |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 宣告 `plugins.slots.*` 使用的一或多個互斥外掛種類（`"memory"`、`"context-engine"`）。同時擁有兩個插槽的外掛會在同一個陣列中宣告這兩種種類。                                                                                                                                  |
| `channels`                           | 否       | `string[]`                   | 此外掛所擁有的頻道 ID。用於探索和設定驗證。                                                                                                                                                                                                                                |
| `providers`                          | 否       | `string[]`                   | 此外掛所擁有的提供者 ID。                                                                                                                                                                                                                                                  |
| `providerCatalogEntry`               | 否       | `string`                     | 相對於外掛根目錄的輕量提供者目錄模組路徑，用於資訊清單範圍的提供者目錄中繼資料，無須啟用完整的外掛執行階段即可載入。                                                                                                                                                         |
| `modelSupport`                       | 否       | `object`                     | 由資訊清單擁有的模型系列中繼資料簡寫，用於在執行階段之前自動載入外掛。                                                                                                                                                                                                     |
| `modelCatalog`                       | 否       | `object`                     | 此外掛所擁有之提供者的宣告式模型目錄中繼資料。這是未來唯讀清單、初始設定、模型選擇器、別名及抑制功能的控制平面合約，無須載入外掛執行階段。                                                                                                                                   |
| `modelPricing`                       | 否       | `object`                     | 由提供者擁有的外部價格查詢原則。使用此欄位可讓本機／自行託管的提供者不使用遠端價格目錄，或將提供者參照對應至 OpenRouter/LiteLLM 目錄 ID，而無須在核心中硬編碼提供者 ID。                                                                                                       |
| `modelIdNormalization`               | 否       | `object`                     | 由提供者擁有的模型 ID 別名／前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                                                                                     |
| `providerEndpoints`                  | 否       | `object[]`                   | 由資訊清單擁有的端點主機／baseUrl 中繼資料，供核心在提供者執行階段載入前分類提供者路由。                                                                                                                                                                                    |
| `providerRequest`                    | 否       | `object`                     | 提供者執行階段載入前，由通用請求原則使用的低成本提供者系列與請求相容性中繼資料。                                                                                                                                                                                           |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 宣告式 SecretRef exec 提供者預設集，讓設定或安裝介面可以提供這些選項，而無須在核心中硬編碼提供者特定整合。                                                                                                                                                                  |
| `cliBackends`                        | 否       | `string[]`                   | 此外掛所擁有的命令列介面推論後端 ID。用於根據明確設定參照在啟動時自動啟用。                                                                                                                                                                                               |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 在執行階段載入前進行冷啟動模型探索時，應探查其外掛自有合成驗證掛鉤的提供者或命令列介面後端參照。                                                                                                                                                                           |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 由內建外掛擁有的預留位置 API 金鑰值，代表非機密的本機、OAuth 或環境認證資訊狀態。                                                                                                                                                                                          |
| `commandAliases`                     | 否       | `object[]`                   | 此外掛所擁有的命令名稱，應在執行階段載入前產生可感知外掛的設定與命令列介面診斷。                                                                                                                                                                                           |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 用於提供者驗證／狀態查詢的已淘汰相容性環境變數中繼資料。新外掛應優先使用 `setup.providers[].envVars`；在淘汰過渡期內，OpenClaw 仍會讀取此欄位。                                                                                                                             |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 僅供用量／計費使用的提供者認證資訊。OpenClaw 使用這些名稱進行用量探索和機密資訊清除，但絕不會將其用於推論驗證。                                                                                                                                                              |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 應重用另一個提供者 ID 進行驗證查詢的提供者 ID，例如與基礎提供者共用 API 金鑰及驗證設定檔的程式設計提供者。                                                                                                                                                                  |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 無須載入外掛程式碼即可檢查的低成本頻道環境變數中繼資料。用於通用啟動／設定輔助程式應能識別的環境變數驅動頻道設定或驗證介面。                                                                                                                                         |
| `providerAuthChoices`                | 否       | `object[]`                   | 用於初始設定選擇器、偏好提供者解析及簡易命令列介面旗標接線的低成本驗證選項中繼資料。                                                                                                                                                                                       |
| `activation`                         | 否       | `object`                     | 用於啟動、提供者、命令、頻道、路由及能力觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由外掛執行階段擁有。                                                                                                                                                     |
| `setup`                              | 否       | `object`                     | 探索與設定介面無須載入外掛執行階段即可檢查的低成本設定／初始設定描述項。                                                                                                                                                                                                  |
| `qaRunners`                          | 否       | `object[]`                   | 共用 `openclaw qa` 主機在外掛執行階段載入前使用的低成本 QA 執行器描述項。                                                                                                                                                                                                 |
| `contracts`                          | 否       | `object`                     | 外部驗證掛鉤、嵌入、語音、即時轉錄、即時語音、媒體理解、影像／影片／音樂生成、網頁擷取、網頁搜尋、工作者提供者、文件／網頁內容擷取及工具擁有權的靜態能力擁有權快照。                                                                                                           |
| `configContracts`                    | 否       | `object`                     | 由資訊清單擁有、供通用核心輔助程式使用的設定行為：危險旗標偵測、SecretRef 遷移目標及舊版設定路徑縮限。請參閱 [configContracts 參考資料](#configcontracts-reference)。                                                                                                          |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 為 `contracts.mediaUnderstandingProviders` 中宣告的供應商 ID 提供低成本的媒體理解預設值。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.imageGenerationProviders` 中宣告的供應商 ID 提供低成本的影像生成驗證中繼資料，包括供應商自有的驗證別名與基礎 URL 防護。                                                                                                         |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.videoGenerationProviders` 中宣告的供應商 ID 提供低成本的影片生成驗證中繼資料，包括供應商自有的驗證別名與基礎 URL 防護。                                                                                                         |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 為 `contracts.musicGenerationProviders` 中宣告的供應商 ID 提供低成本的音樂生成驗證中繼資料，包括供應商自有的驗證別名與基礎 URL 防護。                                                                                                         |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 為 `contracts.tools` 中宣告的外掛自有工具提供低成本的可用性中繼資料。當工具只有在存在設定、環境變數或驗證依據時才應載入執行階段，請使用此項。                                                                                                  |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 在載入執行階段前，合併至探索與驗證介面的資訊清單自有頻道設定中繼資料。                                                                                                                                                                 |
| `skills`                             | 否       | `string[]`                   | 要載入的 Skill 目錄，相對於外掛根目錄。                                                                                                                                                                                                                    |
| `name`                               | 否       | `string`                     | 人類可讀的外掛名稱。                                                                                                                                                                                                                                                |
| `description`                        | 否       | `string`                     | 顯示於外掛介面中的簡短摘要。                                                                                                                                                                                                                                    |
| `catalog`                            | 否       | `object`                     | 外掛目錄介面的選用呈現提示。此中繼資料不會安裝、啟用外掛，也不會授予外掛信任。                                                                                                                                               |
| `icon`                               | 否       | `string`                     | 市集／目錄卡片使用的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL；若省略此項或其值無效，則改用預設外掛圖示。                                                                                                         |
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

| 欄位       | 類型      | 意義                                                                       |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | 目錄介面是否應將此外掛列為精選項目。                                       |
| `order`    | `number`  | 精選外掛之間的遞增顯示順序提示；數值較低者會較早出現。                     |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述相符 `contracts.*GenerationProviders` 清單中所宣告提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具不必匯入每個提供者外掛，就能判斷生成提供者是否可用。

這些欄位僅用於低成本的宣告式事實。傳輸、請求轉換、權杖重新整理、認證資訊驗證，以及實際生成行為，都由外掛執行階段負責。

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

| 欄位                   | 必要 | 類型       | 意義                                                                                                                                                 |
| ---------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 否   | `string[]` | 應視為此生成提供者靜態驗證別名的其他提供者 ID。                                                                                                      |
| `authProviders`        | 否   | `string[]` | 其已設定驗證設定檔應視為此生成提供者驗證依據的提供者 ID。                                                                                            |
| `configSignals`        | 否   | `object[]` | 適用於不需驗證設定檔或環境變數即可設定之本機或自行託管提供者的低成本純設定可用性訊號。                                                                |
| `authSignals`          | 否   | `object[]` | 明確的驗證訊號。若存在，會取代由提供者 ID、`aliases` 和 `authProviders` 組成的預設訊號集。                                                            |
| `referenceAudioInputs` | 否   | `boolean`  | 僅限影片生成。當提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。                                                       |

每個 `configSignals` 項目支援：

| 欄位             | 必要 | 類型       | 意義                                                                                                                                                                                        |
| ---------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是   | `string`   | 要檢查之外掛所擁有設定物件的點分路徑，例如 `plugins.entries.example.config`。                                                                                                               |
| `overlayPath`    | 否   | `string`   | 根設定內的點分路徑；評估訊號前，其物件應覆疊根物件。適用於 `image`、`video` 或 `music` 等能力專用設定。                                                                                       |
| `overlayMapPath` | 否   | `string`   | 根設定內的點分路徑；其各物件值都應分別覆疊根物件。適用於 `accounts` 等具名帳號對應表，其中任一已設定帳號皆應符合資格。                                                                        |
| `required`       | 否   | `string[]` | 有效設定內必須具有已設定值的點分路徑。字串不得為空；物件與陣列不得為空。                                                                                                                     |
| `requiredAny`    | 否   | `string[]` | 有效設定內的點分路徑，其中至少一個必須具有已設定值。                                                                                                                                         |
| `mode`           | 否   | `object`   | 有效設定內選用的字串模式防護條件。純設定可用性僅適用於某一模式時使用。                                                                                                                       |

每個 `mode` 防護條件支援：

| 欄位         | 必要 | 類型       | 意義                                                                               |
| ------------ | ---- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點分路徑。預設為 `mode`。                                              |
| `default`    | 否   | `string`   | 設定省略該路徑時使用的模式值。                                                     |
| `allowed`    | 否   | `string[]` | 若存在，僅當有效模式為這些值之一時，訊號才會通過。                                 |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式為這些值之一時，訊號會失敗。                                     |

每個 `authSignals` 項目支援：

| 欄位              | 必要 | 類型     | 意義                                                                                                                                                                           |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                                       |
| `providerBaseUrl` | 否   | `object` | 選用的防護條件，僅當參照的已設定提供者使用允許的基底 URL 時，才將此訊號納入計算。驗證別名僅適用於特定 API 時使用。                                                              |

每個 `providerBaseUrl` 防護條件支援：

| 欄位              | 必要 | 類型       | 意義                                                                                                                                                    |
| ----------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 應檢查其 `baseUrl` 的提供者設定 ID。                                                                                                                    |
| `defaultBaseUrl`  | 否   | `string`   | 提供者設定省略 `baseUrl` 時採用的基底 URL。                                                                                                             |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設基底 URL 與這些正規化值均不相符時，會忽略此訊號。                                                                |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 結構，並以工具名稱作為索引鍵。`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 不必只為了讓工具工廠傳回 `null` 而匯入外掛執行階段。

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

除了上述共用的 `configSignals`／`authSignals` 欄位外，`toolMetadata` 項目也接受 `optional`（將工具標記為外掛啟用時非必要）和 `replaySafe`（將工具執行標記為可在未完成的模型回合後安全重複）。

若工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於工廠依賴驗證／設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段進行詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個初始設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此資訊。提供者設定清單會使用這些資訊清單選項、從描述元衍生的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                                                  | 意義                                                                                                                 |
| --------------------- | ---- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此選項所屬的供應商 ID。                                                                                              |
| `method`              | 是   | `string`                                                              | 要分派至的驗證方法 ID。                                                                                              |
| `choiceId`            | 是   | `string`                                                              | 新手引導與命令列介面流程使用的穩定驗證選項 ID。                                                                      |
| `choiceLabel`         | 否   | `string`                                                              | 使用者可見的標籤。若省略，OpenClaw 會改用 `choiceId`。                                                               |
| `choiceHint`          | 否   | `string`                                                              | 選擇器的簡短輔助文字。                                                                                               |
| `assistantPriority`   | 否   | `number`                                                              | 在助理驅動的互動式選擇器中，值越小排序越前面。                                                                       |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 在助理選擇器中隱藏此選項，但仍允許透過命令列介面手動選取。                                                           |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 應將使用者重新導向至此替代選項的舊版選項 ID。                                                                         |
| `groupId`             | 否   | `string`                                                              | 用於將相關選項分組的選用群組 ID。                                                                                    |
| `groupLabel`          | 否   | `string`                                                              | 該群組的使用者可見標籤。                                                                                             |
| `groupHint`           | 否   | `string`                                                              | 該群組的簡短輔助文字。                                                                                               |
| `onboardingFeatured`  | 否   | `boolean`                                                             | 在互動式新手引導選擇器中，於 "More..." 項目之前，將此群組顯示於精選層級。                                            |
| `optionKey`           | 否   | `string`                                                              | 簡單單一旗標驗證流程的內部選項鍵。                                                                                   |
| `cliFlag`             | 否   | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                                    |
| `cliOption`           | 否   | `string`                                                              | 完整的命令列介面選項格式，例如 `--openrouter-api-key <key>`。                                                        |
| `cliDescription`      | 否   | `string`                                                              | 命令列介面說明中使用的描述。                                                                                         |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些新手引導介面中。若省略，預設為 `["text-inference"]`。                                               |

## commandAliases 參考資料

當外掛擁有某個執行階段命令名稱，而使用者可能會誤將其放入 `plugins.allow`，或嘗試將其作為根層級命令列介面命令執行時，請使用 `commandAliases`。OpenClaw 使用此中繼資料進行診斷，無須匯入外掛執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 意義                                                                         |
| ------------ | ---- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此外掛的命令名稱。                                                       |
| `kind`       | 否   | `"runtime-slash"` | 將別名標示為聊天斜線命令，而非根層級命令列介面命令。                         |
| `cliCommand` | 否   | `string`          | 若存在，則為執行命令列介面操作時建議使用的相關根層級命令列介面命令。         |

## activation 參考資料

當外掛能以低成本宣告哪些控制平面事件應將其納入啟用／載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，而非生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證外掛程式碼已經執行。啟用規劃器會使用這些欄位縮小候選外掛範圍，之後才改用現有的資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與掛鉤。

優先使用已能描述擁有權的最精確中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述元或 `contracts` 能表達該關係時，請使用這些欄位。對於無法由這些擁有權欄位表示的額外規劃器提示，請使用 `activation`。對於 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅適用於尚無擁有權欄位的內嵌代理程式框架 ID。

每個外掛都應明確設定 `activation.onStartup`。僅當外掛必須在閘道啟動期間執行時，才將其設為 `true`。當外掛啟動時不執行任何動作，且只應由更精確的觸發條件載入時，請將其設為 `false`。省略 `onStartup` 已不再會隱含地於啟動時載入外掛；請為啟動、頻道、設定、代理程式框架、記憶體或其他更精確的啟用觸發條件使用明確的啟用中繼資料。

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

| 欄位               | 必填 | 類型                                                 | 意義                                                                                                                                                                                             |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | 否   | `boolean`                                            | 明確的閘道啟動啟用設定。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 則使其在啟動時延遲載入，除非其他相符的觸發條件要求載入。                                                     |
| `onProviders`      | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的供應商 ID。                                                                                                                                                         |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的內嵌代理程式框架執行階段 ID。命令列介面後端別名請使用頂層 `cliBackends`。                                                                                             |
| `onCommands`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的命令 ID。                                                                                                                                                           |
| `onChannels`       | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的頻道 ID。                                                                                                                                                           |
| `onRoutes`         | 否   | `string[]`                                           | 應將此外掛納入啟用／載入計畫的路由種類。                                                                                                                                                          |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未明確停用時，應將此外掛納入啟動／載入計畫的根目錄相對設定路徑。                                                                                                                       |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃所使用的廣泛能力提示。可能時請優先使用更精確的欄位。                                                                                                                               |

目前的實際使用者：

- 閘道啟動規劃使用 `activation.onStartup` 進行明確的啟動匯入。
- 由命令觸發的命令列介面規劃會改用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 代理程式執行階段啟動規劃對內嵌框架使用 `activation.onAgentHarnesses`，並對命令列介面執行階段別名使用頂層 `cliBackends[]`。
- 當缺少明確的頻道啟用中繼資料時，由頻道觸發的設定／頻道規劃會改用舊版 `channels[]` 擁有權。
- 啟動外掛規劃會對非頻道的根層級設定介面使用 `activation.onConfigPaths`，例如隨附瀏覽器外掛的 `browser` 區塊。
- 當缺少明確的供應商啟用中繼資料時，由供應商觸發的設定／執行階段規劃會改用舊版 `providers[]` 與頂層 `cliBackends[]` 擁有權。

規劃器診斷能區分明確的啟用提示與資訊清單擁有權後備機制。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤供主機診斷與測試使用；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考資料

當外掛在共用的 `openclaw qa` 根層級下提供一或多個傳輸執行器時，請使用 `qaRunners`。請讓此中繼資料保持輕量且靜態；外掛執行階段仍透過輕量的 `runtime-api.ts` 介面負責實際的命令列介面註冊，該介面會匯出相符的 `qaRunnerCliRegistrations`。選用的 `adapterFactory` 可將傳輸方式公開給共用 QA 情境，而不會變更已註冊命令的執行器。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "對可拋棄式 homeserver 執行由 Docker 支援的 Matrix 即時 QA 管道"
    }
  ]
}
```

| 欄位          | 必填 | 類型     | 意義                                                                    |
| ------------- | ---- | -------- | ----------------------------------------------------------------------- |
| `commandName` | 是   | `string` | 掛載於 `openclaw qa` 下的子命令，例如 `matrix`。                         |
| `description` | 否   | `string` | 共用主機需要預留命令時所使用的後備說明文字。                             |

`adapterFactory` ID 必須與 `commandName` 相符。請勿匯出資訊清單中不存在之命令的註冊項目。

## setup 參考

當設定與上線引導介面需要在執行階段載入前取得成本低廉、由外掛擁有的中繼資料時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並繼續描述命令列介面推論後端。`setup.cliBackends` 是控制平面／設定流程專用的設定描述元介面，這些流程應僅使用中繼資料。

若存在 `setup.providers` 與 `setup.cliBackends`，它們是探索設定時優先使用、以描述元為先的查詢介面。如果描述元只縮小候選外掛的範圍，而設定仍需要功能更豐富的設定階段執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 也會將 `setup.providers[].envVars` 納入通用提供者驗證與環境變數查詢。在淘汰期間，仍透過相容性轉接器支援 `providerAuthEnvVars`，但仍使用它的非內建外掛會收到資訊清單診斷。新外掛應將設定／狀態環境中繼資料放在 `setup.providers[].envVars`。

當計費或組織層級的認證資訊必須啟用 `resolveUsageAuth`，但不得成為推論認證資訊時，請使用 `providerUsageAuthEnvVars`。這些名稱會加入工作區 dotenv 封鎖、ACP 子程序移除、沙箱祕密篩選，以及廣泛的祕密清除。提供者執行階段仍會在 `resolveUsageAuth` 內讀取該值並進行分類。

當沒有設定進入點，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 衍生簡單的設定選項。若需要自訂標籤、命令列介面旗標、上線引導範圍及助理中繼資料，仍優先使用明確的 `providerAuthChoices` 項目。

只有當這些描述元足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 將明確的 `false` 視為僅描述元合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 來查詢設定。如果僅描述元外掛仍提供上述任一設定執行階段進入點，OpenClaw 會回報附加診斷，並繼續忽略該進入點。省略 `requiresRuntime` 會保留舊版備援行為，因此已新增描述元但未新增該旗標的現有外掛不會中斷。

由於設定查詢可能執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 與 `setup.cliBackends[]` 值在所有已探索外掛中都必須保持唯一。若擁有權不明確，系統會採取失敗關閉，而不會依探索順序選出一個結果。

當設定執行階段確實執行時，如果 `setup-api` 註冊了資訊清單描述元未宣告的提供者或命令列介面後端，或描述元沒有對應的執行階段註冊項目，設定登錄診斷會回報描述元偏差。這些診斷為附加性質，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 含義                                                                                       |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | 在設定或上線引導期間公開的提供者 ID。請確保正規化後的 ID 在全域保持唯一。                  |
| `authMethods`  | 否   | `string[]` | 此提供者無須載入完整執行階段即可支援的設定／驗證方法 ID。                                 |
| `envVars`      | 否   | `string[]` | 通用設定／狀態介面可在外掛執行階段載入前檢查的環境變數。                                 |
| `authEvidence` | 否   | `object[]` | 可透過非祕密標記進行驗證之提供者所使用的低成本本機驗證證據檢查。                         |

`authEvidence` 適用於提供者擁有、無須載入執行階段程式碼即可驗證的本機認證資訊標記。這些檢查必須保持低成本且僅限本機：不得進行網路呼叫、讀取鑰匙圈或祕密管理工具、執行殼層命令，也不得探查提供者 API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 含義                                                                                                         |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                               |
| `fileEnvVar`       | 否   | `string`   | 包含明確認證資訊檔案路徑的環境變數。                                                                         |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機認證資訊檔案路徑。支援 `${HOME}` 與 `${APPDATA}`。                  |
| `requiresAnyEnv`   | 否   | `string[]` | 證據要視為有效，列出的環境變數中至少一個必須為非空。                                                         |
| `requiresAllEnv`   | 否   | `string[]` | 證據要視為有效，列出的每個環境變數都必須為非空。                                                             |
| `credentialMarker` | 是   | `string`   | 存在證據時傳回的非祕密標記。                                                                                 |
| `source`           | 否   | `string`   | 驗證／狀態輸出中顯示給使用者的來源標籤。                                                                     |

### setup 欄位

| 欄位               | 必填 | 類型       | 含義                                                                                           |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在設定與上線引導期間公開的提供者設定描述元。                                                   |
| `cliBackends`      | 否   | `string[]` | 用於以描述元為先之設定查詢的設定階段後端 ID。請確保正規化後的 ID 在全域保持唯一。              |
| `configMigrations` | 否   | `string[]` | 由此外掛設定介面擁有的設定遷移 ID。                                                            |
| `requiresRuntime`  | 否   | `boolean`  | 在描述元查詢後，設定是否仍需要執行 `setup-api`。                                               |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型呈現提示的映射。索引鍵可以使用點號表示巢狀設定欄位，但任何路徑區段都不得為 `__proto__`、`constructor` 或 `prototype`；設定程序會拒絕這些名稱。

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

| 欄位          | 類型       | 含義                         |
| ------------- | ---------- | ---------------------------- |
| `label`       | `string`   | 顯示給使用者的欄位標籤。     |
| `help`        | `string`   | 簡短的輔助文字。             |
| `tags`        | `string[]` | 選用的使用者介面標籤。       |
| `advanced`    | `boolean`  | 將欄位標示為進階。           |
| `sensitive`   | `boolean`  | 將欄位標示為祕密或敏感資訊。 |
| `placeholder` | `string`   | 表單輸入欄位的預留位置文字。 |

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

每個清單都是選用的：

| 欄位                             | 類型       | 含義                                                                                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 擴充功能工廠 ID，目前為 `codex-app-server`。                                                                        |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果中介軟體的執行階段 ID。                                                                                      |
| `trustedToolPolicies`            | `string[]` | 已安裝的外掛可註冊之外掛本機受信任工具執行前原則 ID。隨附外掛無須此欄位即可註冊原則。                                                |
| `externalAuthProviders`          | `string[]` | 此外掛所擁有之外部驗證設定檔鉤子的提供者 ID。                                                                                        |
| `embeddingProviders`             | `string[]` | 此外掛所擁有、用於可重複使用向量嵌入（包括記憶）的通用嵌入提供者 ID。                                                               |
| `speechProviders`                | `string[]` | 此外掛所擁有的語音提供者 ID。                                                                                                       |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛所擁有的即時轉錄提供者 ID。                                                                                                   |
| `realtimeVoiceProviders`         | `string[]` | 此外掛所擁有的即時語音提供者 ID。                                                                                                   |
| `memoryEmbeddingProviders`       | `string[]` | 此外掛所擁有、已淘汰的記憶專用嵌入提供者 ID。                                                                                        |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛所擁有的媒體理解提供者 ID。                                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 此外掛所擁有的逐字稿來源提供者 ID。                                                                                                 |
| `documentExtractors`             | `string[]` | 此外掛所擁有的文件（例如 PDF）擷取器提供者 ID。                                                                                      |
| `imageGenerationProviders`       | `string[]` | 此外掛所擁有的影像生成提供者 ID。                                                                                                   |
| `videoGenerationProviders`       | `string[]` | 此外掛所擁有的影片生成提供者 ID。                                                                                                   |
| `musicGenerationProviders`       | `string[]` | 此外掛所擁有的音樂生成提供者 ID。                                                                                                   |
| `webContentExtractors`           | `string[]` | 此外掛所擁有的網頁內容擷取提供者 ID。                                                                                               |
| `webFetchProviders`              | `string[]` | 此外掛所擁有的網頁擷取提供者 ID。                                                                                                   |
| `webSearchProviders`             | `string[]` | 此外掛所擁有的網頁搜尋提供者 ID。                                                                                                   |
| `workerProviders`                | `string[]` | 此外掛所擁有、用於佈建及以設定檔為基礎之租約生命週期的雲端工作器提供者 ID。                                                         |
| `usageProviders`                 | `string[]` | 此外掛所擁有之用量驗證與用量快照鉤子的提供者 ID。                                                                                   |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 所擁有的匯入提供者 ID。                                                                                  |
| `gatewayMethodDispatch`          | `string[]` | 為在程序內分派閘道方法的已驗證外掛 HTTP 路由保留的授權。                                                                             |
| `tools`                          | `string[]` | 此外掛所擁有的代理程式工具名稱。                                                                                                    |

`contracts.embeddedExtensionFactories` 保留供隨附的 Codex app-server 專用擴充功能工廠使用。隨附的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並以 `api.registerAgentToolResultMiddleware(...)` 註冊。已安裝的外掛只有在明確啟用時，才能使用相同的中介軟體接合點，且僅限其在 `contracts.agentToolResultMiddleware` 中宣告的執行階段。

需要主機受信任工具執行前原則層級的已安裝外掛，必須在 `contracts.trustedToolPolicies` 中宣告每個已註冊的本機 ID，並且須明確啟用。隨附外掛沿用現有的受信任原則路徑，但具有未宣告原則 ID 的已安裝外掛會在註冊前遭拒。原則 ID 的範圍限定於註冊該原則的外掛，因此兩個外掛都可以宣告並註冊 `workflow-budget`；單一外掛則不得重複註冊相同的本機 ID。

執行階段的 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，僅載入可能擁有所要求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的提供者外掛應宣告 `contracts.externalAuthProviders`；未宣告的外部驗證鉤子會被忽略。

同時實作 `resolveUsageAuth` 與 `fetchUsageSnapshot` 的提供者外掛，應在 `contracts.usageProviders` 中宣告每個自動探索到的提供者 ID。用量探索會先讀取此合約，再載入執行階段程式碼，接著僅載入已宣告的擁有者，並在載入後驗證兩個鉤子。

通用嵌入提供者應為每個以 `api.registerEmbeddingProvider(...)` 註冊的配接器宣告 `contracts.embeddingProviders`。可重複使用的向量生成應採用通用合約，包括供記憶搜尋使用的提供者。`contracts.memoryEmbeddingProviders` 是已淘汰的記憶專用相容性機制，僅在現有提供者遷移至通用嵌入提供者接合點期間保留。

工作器提供者必須在 `contracts.workerProviders` 中宣告每個 `api.registerWorkerProvider(...)` ID。核心會在呼叫 `provision` 前保存持久意圖；提供者會在外部分配前驗證其設定，而且使用相同操作 ID 的重複呼叫必須採用相同租約。核心也會保存該已驗證的設定快照，並將其連同 `leaseId` 傳給 `inspect({ leaseId, profile })` 與 `destroy({ leaseId, profile })`，即使具名設定檔之後遭變更或移除亦然。銷毀操作具等冪性，檢查會回傳封閉的 `active` / `destroyed` / `unknown` 狀態聯集，而 SSH 私密金鑰資料只能透過 `SecretRef` 參照。佈建的 SSH 端點也必須包含來自受信任佈建輸出的公開 `hostKey`，格式須恰為 `algorithm base64`，不得含主機名稱或註解，以便核心在連線前固定主機金鑰。產生動態身分參照的提供者可以實作具權威性的 `resolveSshIdentity({ leaseId, profile, keyRef })`；未實作此功能的提供者則使用核心的通用秘密解析器。具權威性的 `unknown` 會使作用中的本機記錄成為孤立記錄；若已保存銷毀要求，則會確認清除完成。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。這是供有意在程序內分派閘道控制平面方法的原生外掛 HTTP 路由使用的 API 衛生閘門，而非防範惡意原生外掛的沙箱。此項僅適用於已經要求閘道 HTTP 驗證、並經過嚴格審查的隨附／操作員介面。當閘道根工作接納關閉時，獲授權的路由只有在同時宣告 `auth: "gateway"` 與該路由專屬的 `gatewayRuntimeScopeSurface: "trusted-operator"` 時仍可存取；同一外掛的一般同層路由仍受接納邊界限制。如此可在不授予整個外掛接納略過權限的情況下，持續存取暫停狀態與恢復功能。請將分派以外的剖析與回應塑形限制在適當範圍內；實質性或會變更狀態的工作必須透過閘道方法分派執行，由其負責接納與範圍強制執行。

## configContracts 參考

對於通用核心輔助程式需要使用、但不應匯入外掛執行階段的清單擁有設定行為，請使用 `configContracts`：危險旗標偵測、SecretRef 遷移目標，以及舊版設定路徑限縮。

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
| `compatibilityMigrationPaths` | 否   | `string[]` | 表示此外掛的設定階段相容性遷移可能適用的根目錄相對設定路徑。當設定完全未參照此外掛時，通用執行階段設定讀取便可略過此外掛的所有設定介面。                                                               |
| `compatibilityRuntimePaths`   | 否   | `string[]` | 在外掛程式碼完全啟用前，此外掛可於執行階段處理的根目錄相對相容性路徑。適用於應縮小隨附候選集合、而無須匯入每個相容外掛執行階段的舊版介面。                                                           |
| `dangerousFlags`              | 否   | `object[]` | 啟用時 `openclaw doctor` 應標示為不安全或危險的設定常值。詳見下文。                                                                                                                                                                    |
| `secretInputs`                | 否   | `object`   | 位於 `plugins.entries.<id>.config` 下，SecretRef 遷移／稽核目標登錄檔應視為秘密形式字串的設定路徑。詳見下文。                                                                                                                          |

每個 `dangerousFlags` 項目支援：

| 欄位     | 必要 | 類型                                  | 含義                                                                                                                   |
| -------- | ---- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `path`   | 是   | `string`                              | 相對於 `plugins.entries.<id>.config`、以點分隔的設定路徑。支援用於對應／陣列區段的 `*` 萬用字元。                       |
| `equals` | 是   | `string \| number \| boolean \| null` | 將此設定值標記為危險的完全相符常值。                                                                                   |

`secretInputs` 支援：

| 欄位                    | 必填 | 類型       | 意義                                                                                                                                                                                                                     |
| ----------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bundledDefaultEnabled` | 否   | `boolean`  | 在判斷此 SecretRef 介面是否啟用時，覆寫內建外掛的預設啟用狀態。當外掛已內建，但此介面在設定中明確啟用之前應維持停用時，請使用此欄位。                                                                                       |
| `paths`                 | 是   | `object[]` | 採用密鑰形態的設定路徑；每個項目包含 `path`（以點分隔、相對於 `plugins.entries.<id>.config`，支援 `*` 萬用字元），以及選用的 `expected`（目前僅支援 `"string"`）。                                                          |

## mediaUnderstandingProviderMetadata 參考資料

當媒體理解供應商具有預設模型、自動認證備援優先順序，或通用核心輔助程式在執行階段載入前所需的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

| 欄位                   | 類型                                                             | 意義                                                                                                    |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此供應商公開的媒體能力。                                                                                |
| `defaultModels`        | `Record<string, string>`                                         | 當設定未指定模型時使用的能力至模型預設值。                                                              |
| `autoPriority`         | `Record<string, number>`                                         | 以認證資訊為基礎自動備援供應商時，數字越小排序越前。                                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 供應商支援的原生文件輸入。                                                                              |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 各文件類型的模型覆寫。將 `image: false` 設定為停用該文件類型以影像為基礎的擷取。                         |

## channelConfigs 參考資料

當頻道外掛需要在執行階段載入前取得低成本的設定中繼資料時，請使用 `channelConfigs`。若沒有設定項目可用，或 `setup.requiresRuntime: false` 宣告設定作業不需要執行階段，唯讀頻道設定／狀態探索便可直接針對已設定的外部頻道使用此中繼資料。

`channelConfigs` 是外掛資訊清單中繼資料，不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定頻道執行個體。OpenClaw 會讀取資訊清單中繼資料，以便在外掛執行階段程式碼執行前，判斷哪個外掛擁有該已設定頻道。

對頻道外掛而言，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非內建外掛也應宣告相符的 `channelConfigs` 項目。若未宣告，OpenClaw 仍可載入外掛，但在外掛執行階段執行前，冷路徑設定結構描述、設定作業和 Control UI 介面無法得知該頻道所擁有的選項形態。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可為頻道執行階段載入前執行的命令設定檢查，宣告靜態 `auto` 預設值。內建頻道也可透過 `package.json#openclaw.channel.commands`，連同其他套件所擁有的頻道目錄中繼資料發布相同預設值。

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

| 欄位          | 類型                     | 意義                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的頻道設定項目都必須提供。                          |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤／預留位置／敏感資訊提示。                                        |
| `label`       | `string`                 | 執行階段中繼資料尚未就緒時，合併至選擇器和檢查介面的頻道標籤。                               |
| `description` | `string`                 | 用於檢查和目錄介面的簡短頻道說明。                                                           |
| `commands`    | `object`                 | 用於執行階段載入前設定檢查的靜態原生命令和原生 Skills 自動預設值。                           |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於其上的舊版或較低優先順序外掛 ID。                                  |

### 取代另一個頻道外掛

當你的外掛是某個頻道 ID 的首選擁有者，而另一個外掛也能提供該頻道時，請使用 `preferOver`。常見情況包括重新命名的外掛 ID、取代內建外掛的獨立外掛，或為了設定相容性而保留相同頻道 ID 的持續維護分支。

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

設定 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 和首選外掛 ID。若較低優先順序的外掛僅因其為內建或預設啟用而被選取，OpenClaw 會在有效的執行階段設定中停用該外掛，讓單一外掛擁有該頻道及其工具。使用者明確選擇仍具有最高優先權：若使用者明確啟用兩個外掛（透過 `plugins.allow` 或實質的 `plugins.entries` 設定），OpenClaw 會保留該選擇並回報重複的頻道／工具診斷，而不會默默變更所要求的外掛集合。

請將 `preferOver` 限定於確實能提供相同頻道的外掛 ID。它不是通用優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考資料

當 OpenClaw 應在外掛執行階段載入前，從 `gpt-5.6-sol` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷你的供應商外掛時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用以下優先順序：

- 明確的 `provider/model` 參照使用所屬 `providers` 資訊清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 若一個非內建外掛和一個內建外掛都相符，非內建外掛優先
- 其餘歧義會忽略，直到使用者或設定指定供應商為止

欄位：

| 欄位            | 類型       | 意義                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 比對簡寫模型 ID 的前綴。                           |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，用來比對簡寫模型 ID 的正規表示式來源。             |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯；該函式會拒絕包含巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被默默略過，處理方式與語法無效的正規表示式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考資料

當 OpenClaw 應在載入外掛執行階段前得知供應商模型中繼資料時，請使用 `modelCatalog`。這是資訊清單所擁有的固定目錄資料列、供應商別名、抑制規則和探索模式來源。執行階段重新整理仍由供應商執行階段程式碼負責，但資訊清單會告知核心何時需要執行階段。

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

| 欄位             | 類型                                                     | 說明                                                                                                         |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | 此外掛所擁有之供應商 ID 的目錄資料列。鍵也應出現在頂層 `providers` 中。                                      |
| `aliases`        | `Record<string, object>`                                 | 在目錄或抑制規劃中，應解析至此外掛所擁有供應商的供應商別名。                                                 |
| `suppressions`   | `object[]`                                               | 此外掛因供應商特定原因而抑制的其他來源模型資料列。                                                           |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 供應商目錄是否可從資訊清單中繼資料讀取、重新整理至快取，或需要執行階段。                                     |
| `runtimeAugment` | `boolean`                                                | 僅當供應商執行階段必須在資訊清單／設定規劃後附加目錄資料列時，才設為 `true`。                                |

`aliases` 會參與模型目錄規劃的供應商擁有權查找。別名目標必須是同一外掛所擁有的頂層供應商。當依供應商篩選的清單使用別名時，OpenClaw 無須載入供應商執行階段，即可讀取所屬資訊清單並套用別名的 API／基底 URL 覆寫。別名不會展開未篩選的目錄清單；廣泛清單只會輸出所屬的標準供應商資料列。

`suppressions` 取代舊有的供應商執行階段 `suppressBuiltInModel` 掛鉤。只有當供應商由此外掛擁有，或宣告為指向所擁有供應商的 `modelCatalog.aliases` 鍵時，才會採用抑制項目。模型解析期間不再呼叫執行階段抑制掛鉤。

供應商欄位：

| 欄位                  | 類型                     | 說明                                                                                                                                                                                                                |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | 此供應商目錄中模型的選用預設基底 URL。                                                                                                                                                                              |
| `api`                 | `ModelApi`               | 此供應商目錄中模型的選用預設 API 轉接器。                                                                                                                                                                           |
| `headers`             | `Record<string, string>` | 套用至此供應商目錄的選用靜態標頭。                                                                                                                                                                                  |
| `defaultUtilityModel` | `string`                 | 供應商建議用於簡短內部公用任務（標題、進度敘述）的選用小型模型 ID。當未設定 `agents.defaults.utilityModel`，且此供應商提供代理程式的主要模型時使用。                                                                   |
| `models`              | `object[]`               | 必要的模型資料列。缺少 `id` 的資料列會被忽略。                                                                                                                                                                      |

模型欄位：

| 欄位               | 類型                                                           | 說明                                                                       |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 供應商本機模型 ID，不含 `provider/` 前綴。                                 |
| `name`             | `string`                                                       | 選用顯示名稱。                                                             |
| `api`              | `ModelApi`                                                     | 選用的各模型 API 覆寫。                                                    |
| `baseUrl`          | `string`                                                       | 選用的各模型基底 URL 覆寫。                                                |
| `headers`          | `Record<string, string>`                                       | 選用的各模型靜態標頭。                                                     |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模態。其他值會被無提示地捨棄。                                   |
| `reasoning`        | `boolean`                                                      | 模型是否提供推理行為。                                                     |
| `contextWindow`    | `number`                                                       | 供應商原生的上下文視窗。                                                   |
| `contextTokens`    | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段上下文上限。                  |
| `maxTokens`        | `number`                                                       | 已知時的最大輸出權杖數。                                                   |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 選用的各思考層級模型 ID 或參數覆寫。                                       |
| `cost`             | `object`                                                       | 選用的每百萬權杖美元定價，包括選用的 `tieredPricing`。                     |
| `compat`           | `object`                                                       | 與 OpenClaw 模型設定相容性相符的選用相容性旗標。                           |
| `mediaInput`       | `object`                                                       | 選用的各模態輸入設定，目前僅限影像。                                       |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 清單狀態。只有當資料列完全不應出現時才予以抑制。                           |
| `statusReason`     | `string`                                                       | 非可用狀態旁顯示的選用原因。                                               |
| `replaces`         | `string[]`                                                     | 此模型取代的舊版供應商本機模型 ID。                                        |
| `replacedBy`       | `string`                                                       | 已棄用資料列的替代供應商本機模型 ID。                                      |
| `tags`             | `string[]`                                                     | 選取器與篩選器使用的穩定標籤。                                             |

抑制欄位：

| 欄位                       | 類型       | 說明                                                                                                    |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制之上游資料列的供應商 ID。必須由此外掛擁有，或宣告為其擁有的別名。                                 |
| `model`                    | `string`   | 要抑制的供應商本機模型 ID。                                                                             |
| `reason`                   | `string`   | 直接要求遭抑制的資料列時顯示的選用訊息。                                                                |
| `when.baseUrlHosts`        | `string[]` | 套用抑制前所需之有效供應商基底 URL 主機的選用清單。                                                     |
| `when.providerConfigApiIn` | `string[]` | 套用抑制前所需之精確供應商設定 `api` 值的選用清單。                                                     |

不要將僅供執行階段使用的資料放入 `modelCatalog`。只有當資訊清單資料列足夠完整，使依供應商篩選的清單與選擇器介面能略過登錄檔／執行階段探索時，才使用 `static`。當資訊清單資料列可作為實用且可列出的初始資料或補充資料，但重新整理／快取稍後還能新增更多資料列時，請使用 `refreshable`；可重新整理的資料列本身不具權威性。當 OpenClaw 必須載入供應商執行階段才能得知清單時，請使用 `runtime`。

## modelIdNormalization 參考

對於必須在載入供應商執行階段之前執行、成本低廉且由供應商擁有的模型 ID 清理，請使用 `modelIdNormalization`。這會將短模型名稱、供應商本地的舊版 ID，以及代理前綴規則等別名保留在所屬外掛的資訊清單中，而不是放在核心模型選擇表格裡。

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

| 欄位                                 | 類型                    | 含義                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的模型 ID 完全比對別名。值會依原樣傳回。                                     |
| `stripPrefixes`                      | `string[]`              | 在查找別名前要移除的前綴，適用於舊版供應商／模型重複情況。                               |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                                        |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 查找別名後的條件式無前綴 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。                 |

## providerEndpoints 參考

對於通用請求政策必須在載入供應商執行階段之前得知的端點分類，請使用 `providerEndpoints`。核心仍負責定義每個 `endpointClass` 的含義；外掛資訊清單則負責主機與基底 URL 中繼資料。

正式外部化的供應商外掛不包含在核心發行版中，因此在安裝前無法看到其資訊清單。其 `providerEndpoints` 也必須鏡像至 `scripts/lib/official-external-provider-catalog.json`，以便在沒有該外掛時仍可正常進行端點分類；契約測試會強制驗證此鏡像。

端點欄位：

| 欄位                           | 型別       | 含義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                   |
| `hosts`                        | `string[]` | 對應至端點類別的確切主機名稱。                                                                 |
| `hostSuffixes`                 | `string[]` | 對應至端點類別的主機名稱後綴。以 `.` 開頭可僅比對網域後綴。                                    |
| `baseUrls`                     | `string[]` | 對應至端點類別且經正規化的確切 HTTP(S) 基底 URL。                                               |
| `googleVertexRegion`           | `string`   | 用於確切全域主機的靜態 Google Vertex 區域。                                                     |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的後綴，以顯示 Google Vertex 區域前綴。                                           |

## providerRequest 參考

當通用請求政策需要低成本的請求相容性中繼資料，而不需載入供應商執行階段時，請使用 `providerRequest`。將行為特定的酬載改寫保留在供應商執行階段鉤子或共用供應商系列輔助函式中。

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

| 欄位                  | 型別         | 含義                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用請求相容性決策與診斷所使用的供應商系列標籤。                                       |
| `compatibilityFamily` | `"moonshot"` | 供共用請求輔助函式使用的選用供應商系列相容性分類。                                     |
| `openAICompletions`   | `object`     | OpenAI 相容的補全請求旗標，目前為 `supportsStreamingUsage`。                           |

## secretProviderIntegrations 參考

當外掛可發布可重複使用的 SecretRef exec 供應商預設時，請使用 `secretProviderIntegrations`。OpenClaw 會在載入外掛執行階段前讀取此中繼資料，將外掛擁有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際的密鑰解析交由 SecretRef 執行階段處理。預設僅會針對內建外掛，以及從受管理外掛安裝根目錄探索到的已安裝外掛公開，例如透過 git 與 ClawHub 安裝的外掛。

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

當操作者選取預設時，OpenClaw 會寫入如下的供應商參照：

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

啟動或重新載入時，OpenClaw 會載入目前的外掛資訊清單中繼資料、檢查擁有該供應商的外掛是否已安裝並啟用，再從資訊清單具體化 exec 命令，以解析該供應商。停用或移除外掛會撤銷作用中 SecretRef 的該供應商。想使用獨立 exec 設定的操作者，仍可直接手動寫入含 `command`/`args` 的供應商設定。

目前僅支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]` 必須是相對於外掛根目錄、以 `./` 開頭的解析器指令碼。OpenClaw 會在啟動或重新載入時，將其具體化為目前的 Node 執行檔與外掛內指令碼的絕對路徑。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 選項不屬於資訊清單預設契約。需要非 Node 命令的操作者，可直接設定獨立的手動 exec 供應商。

OpenClaw 會從外掛根目錄推導資訊清單預設的 `trustedDirs`，若是 `${node}` 預設，還會加入目前 Node 執行檔的目錄。資訊清單中編寫的 `trustedDirs` 會被忽略。其他 exec 供應商選項（例如 `timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath`）會直接傳遞至一般 SecretRef exec 供應商設定。

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

| 欄位         | 型別              | 含義                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對絕不應擷取 OpenRouter 或 LiteLLM 定價的本機／自行託管供應商設為 `false`。                       |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此供應商的 OpenRouter 查詢。                               |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此供應商的 LiteLLM 查詢。                                    |

來源欄位：

| 欄位                       | 型別               | 含義                                                                                                                  |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 與 OpenClaw 供應商 ID 不同時所使用的外部目錄供應商 ID，例如 `zai` 供應商使用 `z-ai`。                                 |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀的供應商／模型參照，適用於 OpenRouter 等代理供應商。                                      |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的點號版本 ID。                                 |

### OpenClaw 供應商索引

OpenClaw 供應商索引是由 OpenClaw 擁有的預覽中繼資料，適用於其外掛可能尚未安裝的供應商。它不屬於外掛資訊清單。外掛資訊清單仍是已安裝外掛的權威來源。供應商索引是內部後援契約，未來的可安裝供應商與安裝前模型選擇器介面會在供應商外掛尚未安裝時使用它。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛資訊清單的 `modelCatalog`。
3. 透過明確重新整理產生的模型目錄快取。
4. OpenClaw 供應商索引預覽資料列。

供應商索引不得包含密鑰、啟用狀態、執行階段鉤子或即時帳號特定模型資料。其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 供應商資料列格式，但除非刻意讓 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位與已安裝外掛資訊清單保持一致，否則應僅限於穩定的顯示中繼資料。具有即時 `/models` 探索功能的供應商，應透過明確的模型目錄快取路徑寫入重新整理後的資料列，而非讓一般清單顯示或導覽設定流程呼叫供應商 API。

供應商索引項目也可為已移出核心或尚未安裝外掛的供應商包含可安裝外掛中繼資料。此中繼資料依循頻道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及低成本的驗證選項標籤，即足以顯示可安裝的設定選項。外掛安裝後，其資訊清單優先，該供應商的供應商索引項目會被忽略。

`openclaw doctor --fix` 會將一小組封閉的舊版頂層資訊清單功能鍵遷移至 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。這些鍵（或任何其他功能清單）都不再作為頂層資訊清單欄位讀取；一般資訊清單載入只會辨識 `contracts` 下的這些鍵。

## 資訊清單與 package.json 的比較

這兩個檔案各自負責不同用途：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選項中繼資料，以及必須在外掛程式碼執行前存在的 UI 提示                                                   |
| `package.json`         | npm 中繼資料、相依套件安裝，以及用於進入點、安裝門檻、設定或目錄中繼資料的 `openclaw` 區塊                                  |

如果不確定某項中繼資料應放在哪裡，請遵循以下規則：

- 如果 OpenClaw 必須在載入外掛程式碼前知道它，請將其放入 `openclaw.plugin.json`
- 如果它與封裝、進入點檔案或 npm 安裝行為有關，請將其放入 `package.json`

### 影響探索的 package.json 欄位

部分執行階段前的外掛中繼資料會刻意放在 `package.json` 的 `openclaw` 區塊下，而非 `openclaw.plugin.json`。`openclaw.bundle` 與 `openclaw.bundle.json` 並非 OpenClaw 外掛契約；原生外掛必須使用 `openclaw.plugin.json`，以及下方支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 意義                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須位於外掛套件目錄內。                                                                                                                                         |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件建置後的 JavaScript 執行階段進入點。必須位於外掛套件目錄內。                                                                                                           |
| `openclaw.setupEntry`                                                                      | 輕量、僅供設定使用的進入點，用於初始設定、延後啟動頻道，以及唯讀的頻道狀態／SecretRef 探索。必須位於外掛套件目錄內。                                                                  |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件建置後的 JavaScript 設定進入點。需要 `setupEntry`、必須存在，且必須位於外掛套件目錄內。                                                                                |
| `openclaw.channel`                                                                         | 輕量的頻道目錄中繼資料，例如標籤、文件路徑、別名及選取說明文字。                                                                                                                     |
| `openclaw.channel.commands`                                                                | 靜態的原生命令與原生技能自動預設中繼資料，在頻道執行階段載入前供設定、稽核及命令清單介面使用。                                                                                       |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已存在僅使用環境變數的設定？」                                                                           |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                 |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 供隨附及外部發布之外掛使用的安裝／更新提示。                                                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | 有多個安裝來源可用時的偏好安裝路徑。                                                                                                                                                 |
| `openclaw.install.minHostVersion`                                                          | 支援的最低 OpenClaw 主機版本，使用如 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                                           |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用如 `>=2026.5.27` 的 semver 下限。                                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm 發布完整性字串，例如 `sha512-...`；安裝及更新流程會依此驗證擷取的成品。                                                                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定無效時，允許使用範圍受限的隨附外掛重新安裝復原路徑。                                                                                                                             |
| `openclaw.install.requiredPlatformPackages`                                                | 當鎖定檔中的平台限制符合目前主機時，必須實際安裝的 npm 套件別名。                                                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允許設定執行階段的頻道介面在開始監聽前載入，然後將完整的已設定頻道外掛延後至開始監聽後才啟用。                                                                                       |

資訊清單中繼資料決定執行階段載入前，初始設定中會顯示哪些供應商／頻道／設定選項。`package.json#openclaw.install` 會告知初始設定，當使用者選擇其中一個選項時，應如何擷取或啟用該外掛。請勿將安裝提示移至 `openclaw.plugin.json`。

對於非隨附來源的外掛，系統會在安裝及載入資訊清單登錄時強制執行 `openclaw.install.minHostVersion`。無效值會遭拒絕；較新但有效的值，會使舊版主機略過外部外掛。隨附的原始碼外掛會被視為與主機簽出版本相同。

`openclaw.install.requiredPlatformPackages` 適用於透過選用且平台特定的別名提供必要原生二進位檔的 npm 套件。請列出每個支援平台別名所對應的裸 npm 套件名稱。執行 npm 安裝時，OpenClaw 只會驗證鎖定檔限制符合目前主機的已宣告別名。若 npm 回報成功卻省略該別名，OpenClaw 會使用全新快取重試一次；若該別名仍然缺少，則會復原安裝。

對於非隨附來源的外掛，系統會在套件安裝期間強制執行 `openclaw.compat.pluginApi`。請用它指定套件建置時所依據的 OpenClaw 外掛 SDK／執行階段 API 下限。當外掛套件需要較新的 API，但仍為其他流程保留較低的安裝提示時，此值可以比 `minHostVersion` 更嚴格。依預設，官方 OpenClaw 版本同步會將現有官方外掛的 API 下限提升至 OpenClaw 發行版本；但若套件刻意支援較舊的主機，僅發布外掛的版本可以保留較低的下限。請勿只使用套件版本作為相容性契約。`peerDependencies.openclaw` 仍是 npm 套件中繼資料；OpenClaw 會使用 `openclaw.compat.pluginApi` 契約來判斷安裝相容性。

若外掛已發布至 ClawHub，官方的隨選安裝中繼資料應使用 `clawhubSpec`；初始設定會將其視為偏好的遠端來源，並於安裝後記錄 ClawHub 成品資訊。對於尚未移至 ClawHub 的套件，`npmSpec` 仍是相容性備援選項。

npm 的精確版本固定已由 `npmSpec` 負責，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確規格與 `expectedIntegrity` 搭配使用，如此一來，若擷取的 npm 成品不再符合固定的發行版本，更新流程便會採取失敗即關閉的處理方式。為了相容性，互動式初始設定仍會提供受信任登錄中的 npm 規格，包括裸套件名稱及 dist-tag。目錄診斷可區分精確、浮動、固定完整性、缺少完整性、套件名稱不符及無效預設選項的來源。當 `expectedIntegrity` 存在，但沒有可供其固定的有效 npm 來源時，也會發出警告。若存在 `expectedIntegrity`，安裝／更新流程會強制執行該值；若省略，則只會記錄登錄解析結果，而不固定完整性。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定的帳號時，頻道外掛應提供 `openclaw.setupEntry`。設定進入點應公開頻道中繼資料，以及設定安全的組態、狀態與機密資料配接器；網路用戶端、閘道監聽器及傳輸執行階段則應保留在主要擴充功能進入點中。

執行階段進入點欄位不會覆寫原始碼進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓逸出套件目錄的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 的適用範圍刻意受到嚴格限制。它不會讓任意損壞的設定變得可安裝。目前它僅允許安裝流程從特定的陳舊隨附外掛升級失敗中復原，例如缺少隨附外掛路徑，或同一隨附外掛具有陳舊的 `channels.<id>` 項目。無關的設定錯誤仍會阻擋安裝，並引導操作者使用 `openclaw doctor --fix`。

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

當設定、診斷、狀態或唯讀存在性流程需要在完整頻道外掛載入前，以低成本的是／否驗證探測進行檢查時，請使用此項。持久化驗證狀態並非已設定的頻道狀態：請勿使用此中繼資料自動啟用外掛、修復執行階段相依項目，或判斷是否應載入頻道執行階段。目標匯出應是僅讀取持久化狀態的小型函式；請勿透過完整頻道執行階段的彙整匯出檔案路由它。

`openclaw.channel.configuredState` 對低成本、僅使用環境變數的已設定檢查採用相同格式：

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

當頻道可透過環境變數或其他極小型的非執行階段輸入判斷已設定狀態時，請使用此項。若檢查需要完整的設定解析或實際頻道執行階段，請改將該邏輯保留在外掛的 `config.hasConfiguredState` 鉤點中。

## 探索優先順序（重複的外掛 ID）

OpenClaw 會從三個根目錄探索外掛，並依下列順序檢查：隨 OpenClaw 提供的隨附外掛、全域安裝根目錄（`~/.openclaw/extensions`）及目前工作區根目錄（`<workspace>/.openclaw/extensions`），另外還包括任何明確的 `plugins.load.paths` 項目。

如果兩個探索結果具有相同的 `id`，只會保留優先順序**最高**的資訊清單；優先順序較低的重複項目會被捨棄，而不會並列載入。優先順序由高至低如下：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確固定的路徑
2. **符合受追蹤安裝記錄的全域安裝** — 透過 `openclaw plugin install`／`openclaw plugin update` 安裝，且 OpenClaw 的安裝追蹤可辨識為相同 ID 的外掛，即使該 ID 也屬於隨附外掛亦然
3. **隨附** — 隨 OpenClaw 提供的外掛
4. **工作區** — 相對於目前工作區探索到的外掛
5. 任何其他探索到的候選項目

影響：

- 位於工作區或全域根目錄中但未受追蹤的隨附外掛分支版本或陳舊副本，不會遮蔽隨附的建置版本。
- 若要覆寫隨附外掛，可對該 ID 執行 `openclaw plugin install`，讓受追蹤的全域安裝取得高於隨附副本的優先順序；也可以透過 `plugins.entries.<id>` 固定特定路徑，使其憑設定選取優先順序勝出。
- 系統會記錄重複項目的捨棄事件，讓 Doctor 與啟動診斷能指出遭捨棄的副本。
- 在診斷中，設定選取的重複項目覆寫會明確表述為覆寫，但仍會發出警告，讓陳舊分支版本及意外遮蔽保持可見。

## JSON Schema 需求

- **每個外掛都必須提供 JSON Schema**，即使它不接受任何設定也一樣。
- 可接受空的結構描述（例如 `{ "type": "object", "additionalProperties": false }`）。
- 結構描述會在讀取／寫入設定時驗證，而不是在執行階段驗證。
- 使用新的設定鍵擴充或分支修改內建外掛時，請同時更新該外掛 `openclaw.plugin.json` 中的 `configSchema`。內建外掛的結構描述採嚴格模式，因此若在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，卻未將 `myNewKey` 加入 `configSchema.properties`，就會在外掛執行階段載入前遭到拒絕。

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

- 未知的 `channels.*` 鍵屬於**錯誤**，除非外掛資訊清單已宣告該頻道 ID。若相同 ID 也出現在 `plugins.allow`、`plugins.entries` 或 `plugins.installs` 中（亦即該外掛已被參照，但目前無法被探索到），OpenClaw 會將此問題降級為**警告**。
- `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 若參照未知的外掛 ID，屬於**警告**（「已忽略過時的設定項目」）而非錯誤，因此升級及移除／重新命名的外掛不會阻止閘道啟動。
- `plugins.slots.memory` 若參照未知的外掛 ID，屬於**錯誤**；但已知的官方外部外掛 `memory-lancedb` 除外，此情況只會發出警告。
- 如果外掛已安裝，但其資訊清單或結構描述損壞或遺失，驗證會失敗，Doctor 也會回報外掛錯誤。
- 如果外掛設定存在，但外掛已**停用**，設定會保留，Doctor 和記錄中也會顯示**警告**。

如需完整的 `plugins.*` 結構描述，請參閱[設定參考](/zh-TW/gateway/configuration)。

## 注意事項

- **原生 OpenClaw 外掛必須具備資訊清單**，包括從本機檔案系統載入的外掛。執行階段仍會另行載入外掛模組；資訊清單僅用於探索和驗證。
- 原生資訊清單會以 JSON5 解析，因此可接受註解、尾隨逗號及未加引號的鍵，前提是最終值仍為物件。
- 資訊清單載入器只會讀取文件記載的資訊清單欄位。請避免使用自訂的頂層鍵。
- 外掛不需要時，可省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerCatalogEntry` 必須保持輕量，不應匯入廣泛的執行階段程式碼；請將它用於靜態提供者目錄中繼資料或範圍有限的探索描述項，而非請求期間的執行。
- 互斥的外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 使用 `plugins.slots.memory`（預設為 `memory-core`），`kind: "context-engine"` 使用 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此資訊清單中宣告互斥的外掛種類。執行階段進入點的 `OpenClawPluginDefinition.kind` 已淘汰，僅保留作為舊版外掛的相容性後援機制。
- 環境變數中繼資料（`setup.providers[].envVars`、已淘汰的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告用途。狀態、稽核、排程傳遞驗證及其他唯讀介面，在將環境變數視為已設定前，仍會套用外掛信任和有效啟用政策。
- 如需會要求提供者程式碼的執行階段精靈中繼資料，請參閱[提供者執行階段掛鉤](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記載建置步驟及任何套件管理器允許清單要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

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
