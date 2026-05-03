---
read_when:
    - 你正在建置 OpenClaw Plugin
    - 你需要發布 Plugin 設定結構描述，或偵錯 Plugin 驗證錯誤
summary: Plugin 清單 + JSON 結構描述要求（嚴格設定驗證）
title: Plugin 資訊清單
x-i18n:
    generated_at: "2026-05-03T21:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

此頁僅適用於 **原生 OpenClaw Plugin 資訊清單**。

如需相容的套件包版面配置，請參閱 [Plugin 套件包](/zh-TW/plugins/bundles)。

相容的套件包格式使用不同的資訊清單檔案：

- Codex 套件包：`.codex-plugin/plugin.json`
- Claude 套件包：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件
  版面配置
- Cursor 套件包：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些套件包版面配置，但它們不會依照此處描述的
`openclaw.plugin.json` 結構描述進行驗證。

對於相容的套件包，OpenClaw 目前會在版面配置符合 OpenClaw runtime 預期時，
讀取套件包中繼資料以及宣告的 skill 根目錄、Claude 命令根目錄、Claude 套件包
`settings.json` 預設值、Claude 套件包 LSP 預設值，以及支援的 hook 套件組。

每個原生 OpenClaw Plugin **都必須**在 **Plugin 根目錄**中隨附
`openclaw.plugin.json` 檔案。OpenClaw 會使用此資訊清單來驗證設定，
而且**不執行 Plugin 程式碼**。缺少或無效的資訊清單會被視為 Plugin 錯誤，
並封鎖設定驗證。

請參閱完整的 Plugin 系統指南：[Plugins](/zh-TW/tools/plugin)。
如需原生 capability model 和目前的外部相容性指引：
[Capability model](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的 Plugin 程式碼之前**讀取的中繼資料。
以下所有內容都必須足夠低成本，能在不啟動 Plugin runtime 的情況下檢查。

**用途：**

- Plugin 身分識別、設定驗證，以及設定 UI 提示
- auth、onboarding 和 setup 中繼資料（別名、自動啟用、provider env vars、auth choices）
- control-plane surfaces 的啟用提示
- model-family ownership 簡寫
- 靜態 capability-ownership 快照（`contracts`）
- 共享 `openclaw qa` host 可檢查的 QA runner 中繼資料
- 合併到目錄與驗證介面的 channel-specific 設定中繼資料

**請勿用於：**註冊 runtime 行為、宣告程式碼進入點，
或 npm install 中繼資料。這些應放在你的 Plugin 程式碼和 `package.json` 中。

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

| 欄位                                | 必填 | 型別                             | 含義                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是      | `string`                         | 標準 Plugin ID。這是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                 |
| `configSchema`                       | 是      | `object`                         | 此 Plugin 設定的內嵌 JSON Schema。                                                                                                                                                                                        |
| `enabledByDefault`                   | 否       | `true`                           | 將 bundled Plugin 標記為預設啟用。省略此欄位，或設定任何非 `true` 的值，會讓 Plugin 預設保持停用。                                                                                                        |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                       | 僅在列出的 Node.js 平台上，將 bundled Plugin 標記為預設啟用，例如 `["darwin"]`。明確設定仍優先。                                                                                            |
| `legacyPluginIds`                    | 否       | `string[]`                       | 會正規化為此標準 Plugin ID 的舊版 ID。                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 當驗證、設定或模型參照提到這些提供者 ID 時，應自動啟用此 Plugin。                                                                                                                                     |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 宣告 `plugins.slots.*` 使用的互斥 Plugin 類型。                                                                                                                                                                        |
| `channels`                           | 否       | `string[]`                       | 此 Plugin 擁有的頻道 ID。用於探索與設定驗證。                                                                                                                                                         |
| `providers`                          | 否       | `string[]`                       | 此 Plugin 擁有的提供者 ID。                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | 否       | `string`                         | 輕量提供者探索模組路徑，相對於 Plugin 根目錄，用於不啟用完整 Plugin 執行階段即可載入的 manifest 範圍提供者目錄中繼資料。                                               |
| `modelSupport`                       | 否       | `object`                         | manifest 擁有的模型系列簡寫中繼資料，用於在執行階段前自動載入 Plugin。                                                                                                                                         |
| `modelCatalog`                       | 否       | `object`                         | 此 Plugin 擁有的提供者所用的宣告式模型目錄中繼資料。這是未來唯讀清單、初始設定、模型選擇器、別名與抑制在不載入 Plugin 執行階段時使用的控制平面合約。         |
| `modelPricing`                       | 否       | `object`                         | 提供者擁有的外部價格查詢政策。用它讓本機/自行託管的提供者退出遠端價格目錄，或將提供者參照對應到 OpenRouter/LiteLLM 目錄 ID，而不在核心中硬編碼提供者 ID。             |
| `modelIdNormalization`               | 否       | `object`                         | 提供者擁有的模型 ID 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                           |
| `providerEndpoints`                  | 否       | `object[]`                       | manifest 擁有的端點主機/baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                            |
| `providerRequest`                    | 否       | `object`                         | 泛用請求政策在提供者執行階段載入前使用的低成本提供者系列與請求相容性中繼資料。                                                                                                              |
| `cliBackends`                        | 否       | `string[]`                       | 此 Plugin 擁有的 CLI 推論後端 ID。用於從明確設定參照進行啟動時自動啟用。                                                                                                                         |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | 在執行階段載入前的冷模型探索期間，應探測其 Plugin 擁有的合成驗證鉤子的提供者或 CLI 後端參照。                                                                                              |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | bundled Plugin 擁有的預留位置 API 金鑰值，代表非祕密的本機、OAuth 或環境憑證狀態。                                                                                                                |
| `commandAliases`                     | 否       | `object[]`                       | 此 Plugin 擁有的命令名稱，應在執行階段載入前產生具 Plugin 感知能力的設定與 CLI 診斷。                                                                                                                |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | 已棄用的相容性環境中繼資料，用於提供者驗證/狀態查詢。新 Plugin 請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此欄位。                                                 |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 應重用另一個提供者 ID 進行驗證查詢的提供者 ID，例如共用基礎提供者 API 金鑰與驗證設定檔的程式碼提供者。                                                                          |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 可不載入 Plugin 程式碼就檢查的低成本頻道環境中繼資料。將此用於泛用啟動/設定輔助程式應能看到的環境驅動頻道設定或驗證介面。                                            |
| `providerAuthChoices`                | 否       | `object[]`                       | 用於初始設定選擇器、偏好提供者解析與簡單 CLI 旗標接線的低成本驗證選項中繼資料。                                                                                                                       |
| `activation`                         | 否       | `object`                         | 用於啟動、提供者、命令、頻道、路由與能力觸發載入的低成本啟用規劃器中繼資料。僅為中繼資料；實際行為仍由 Plugin 執行階段擁有。                                                       |
| `setup`                              | 否       | `object`                         | 探索與設定介面可不載入 Plugin 執行階段就檢查的低成本設定/初始設定描述子。                                                                                                                    |
| `qaRunners`                          | 否       | `object[]`                       | shared `openclaw qa` 主機在 Plugin 執行階段載入前使用的低成本 QA 執行器描述子。                                                                                                                                      |
| `contracts`                          | 否       | `object`                         | 外部驗證鉤子、語音、即時轉錄、即時語音、媒體理解、影像生成、音樂生成、影片生成、網頁擷取、網頁搜尋與工具所有權的靜態能力所有權快照。 |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | 針對 `contracts.mediaUnderstandingProviders` 中宣告的提供者 ID 的低成本媒體理解預設值。                                                                                                                            |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`         | 針對 `contracts.imageGenerationProviders` 中宣告的提供者 ID 的低成本影像生成驗證中繼資料，包含提供者擁有的驗證別名與 base-url 保護。                                                                  |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`         | 針對 `contracts.videoGenerationProviders` 中宣告的提供者 ID 的低成本影片生成驗證中繼資料，包含提供者擁有的驗證別名與 base-url 保護。                                                                  |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`         | 針對 `contracts.musicGenerationProviders` 中宣告的提供者 ID 的低成本音樂生成驗證中繼資料，包含提供者擁有的驗證別名與 base-url 保護。                                                                  |
| `toolMetadata`                       | 否       | `Record<string, object>`         | 針對 `contracts.tools` 中宣告且由 Plugin 擁有的工具的低成本可用性中繼資料。當工具不應載入執行階段，除非存在設定、環境或驗證證據時使用。                                                           |
| `channelConfigs`                     | 否       | `Record<string, object>`         | manifest 擁有的頻道設定中繼資料，會在執行階段載入前合併到探索與驗證介面中。                                                                                                                          |
| `skills`                             | 否       | `string[]`                       | 要載入的 Skill 目錄，相對於 Plugin 根目錄。                                                                                                                                                                             |
| `name`                               | 否       | `string`                         | 人類可讀的 Plugin 名稱。                                                                                                                                                                                                         |
| `description`                        | 否       | `string`                         | 顯示在 Plugin 介面中的簡短摘要。                                                                                                                                                                                             |
| `version`                            | 否       | `string`                         | 資訊用途的 Plugin 版本。                                                                                                                                                                                                       |
| `uiHints`                            | 否       | `Record<string, object>`         | 設定欄位的 UI 標籤、預留位置文字和敏感性提示。                                                                                                                                                                   |

## 生成供應商中繼資料參考

生成供應商中繼資料欄位描述在相符的 `contracts.*GenerationProviders` 清單中宣告之供應商的靜態驗證訊號。
OpenClaw 會在供應商執行階段載入前讀取這些欄位，讓核心工具可以在不匯入每個供應商 Plugin 的情況下，判斷生成供應商是否可用。

這些欄位只應用於低成本的宣告式事實。傳輸、請求轉換、權杖重新整理、憑證驗證，以及實際生成行為都留在 Plugin 執行階段。

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

| 欄位            | 必填 | 類型       | 含義                                                                                                                        |
| --------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | 否   | `string[]` | 應計為生成供應商之靜態驗證別名的其他供應商 ID。                                                                            |
| `authProviders` | 否   | `string[]` | 其已設定驗證設定檔應計為此生成供應商之驗證的供應商 ID。                                                                    |
| `configSignals` | 否   | `object[]` | 低成本、僅限設定的可用性訊號，適用於不需要驗證設定檔或環境變數即可設定的本機或自託管供應商。                              |
| `authSignals`   | 否   | `object[]` | 明確的驗證訊號。存在時，這些訊號會取代來自供應商 ID、`aliases` 和 `authProviders` 的預設訊號集。                           |

每個 `configSignals` 項目支援：

| 欄位          | 必填 | 類型       | 含義                                                                                                                                                                |
| ------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | 是   | `string`   | 要檢查的 Plugin 所擁有設定物件的點路徑，例如 `plugins.entries.example.config`。                                                                                     |
| `overlayPath` | 否   | `string`   | 根設定內的點路徑；其物件應在評估訊號前覆蓋根物件。請將此用於能力專屬設定，例如 `image`、`video` 或 `music`。                                                        |
| `required`    | 否   | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不得為空；物件和陣列不得為空。                                                                                              |
| `requiredAny` | 否   | `string[]` | 有效設定內的點路徑，其中至少一個必須具有已設定值。                                                                                                                  |
| `mode`        | 否   | `object`   | 有效設定內的選用字串模式防護。當僅限設定的可用性只適用於某個模式時使用。                                                                                            |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                                 |
| ------------ | ---- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                                  |
| `default`    | 否   | `string`   | 設定省略該路徑時使用的模式值。                                                       |
| `allowed`    | 否   | `string[]` | 若存在，只有當有效模式為這些值之一時，訊號才會通過。                                 |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式為這些值之一時，訊號會失敗。                                       |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                     |
| ----------------- | ---- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的供應商 ID。                                                                                                  |
| `providerBaseUrl` | 否   | `object` | 選用防護，只有當參照的已設定供應商使用允許的基底 URL 時，才會計入訊號。當驗證別名只對某些 API 有效時使用。                              |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                       |
| ----------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的供應商設定 ID。                                                                                                     |
| `defaultBaseUrl`  | 否   | `string`   | 供應商設定省略 `baseUrl` 時假設使用的基底 URL。                                                                                            |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設基底 URL 不符合這些正規化值之一時，該訊號會被忽略。                                                |

## 工具中繼資料參考

`toolMetadata` 使用與生成供應商中繼資料相同的 `configSignals` 和 `authSignals` 形狀，並以工具名稱作為鍵。
`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 可以避免只是為了讓工具工廠回傳 `null` 而匯入 Plugin 執行階段。

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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

如果工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的 Plugin。對於其工廠依賴驗證/設定的熱路徑工具，Plugin 作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個入門導覽或驗證選項。
OpenClaw 會在供應商執行階段載入前讀取此項。
供應商設定清單會使用這些資訊清單選項、由描述元衍生的設定選項，以及安裝目錄中繼資料，而不載入供應商執行階段。

| 欄位                  | 必填 | 類型                                            | 含義                                                                                             |
| --------------------- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`            | 是   | `string`                                        | 此選項所屬的供應商 ID。                                                                         |
| `method`              | 是   | `string`                                        | 要分派至的驗證方法 ID。                                                                         |
| `choiceId`            | 是   | `string`                                        | 入門導覽和 CLI 流程使用的穩定驗證選項 ID。                                                      |
| `choiceLabel`         | 否   | `string`                                        | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                      |
| `choiceHint`          | 否   | `string`                                        | 選擇器的簡短輔助文字。                                                                          |
| `assistantPriority`   | 否   | `number`                                        | 較低的值會在助理驅動的互動式選擇器中較早排序。                                                  |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 從助理選擇器隱藏該選項，同時仍允許手動 CLI 選取。                                               |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 應將使用者重新導向至此替代選項的舊選項 ID。                                                     |
| `groupId`             | 否   | `string`                                        | 用於將相關選項分組的選用群組 ID。                                                               |
| `groupLabel`          | 否   | `string`                                        | 該群組面向使用者的標籤。                                                                        |
| `groupHint`           | 否   | `string`                                        | 群組的簡短輔助文字。                                                                            |
| `optionKey`           | 否   | `string`                                        | 簡單單旗標驗證流程的內部選項鍵。                                                                |
| `cliFlag`             | 否   | `string`                                        | CLI 旗標名稱，例如 `--openrouter-api-key`。                                                      |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 選項形狀，例如 `--openrouter-api-key <key>`。                                          |
| `cliDescription`      | 否   | `string`                                        | CLI 說明中使用的描述。                                                                          |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此選項應顯示在哪些入門導覽介面。若省略，預設為 `["text-inference"]`。                           |

## commandAliases 參考

使用 `commandAliases` 的時機，是 Plugin 擁有某個執行階段命令名稱，而使用者可能誤將其放入 `plugins.allow`，或嘗試將其當作根 CLI 命令執行。OpenClaw 會使用此中繼資料進行診斷，而不匯入 Plugin 執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 意義                                                            |
| ------------ | ---- | ----------------- | --------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此 Plugin 的命令名稱。                                      |
| `kind`       | 否   | `"runtime-slash"` | 將別名標示為聊天斜線命令，而不是根 CLI 命令。                   |
| `cliCommand` | 否   | `string`          | 若存在，建議用於 CLI 操作的相關根 CLI 命令。                    |

## activation 參考

當 Plugin 可以低成本宣告哪些控制平面事件應將它納入啟用/載入計畫時，請使用 `activation`。

這個區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為，不會取代 `register(...)`，也不保證 Plugin 程式碼已經執行。啟用規劃器會使用這些欄位先縮小候選 Plugin 範圍，再退回使用既有的資訊清單擁有權中繼資料，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

優先使用已能描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、setup 描述器或 `contracts` 能表達關係時，請使用那些欄位。只有在這些擁有權欄位無法表示額外規劃器提示時，才使用 `activation`。
對於 CLI 執行階段別名，例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 只適用於尚無擁有權欄位的內嵌代理框架 ID。

這個區塊僅是中繼資料。它不會註冊執行階段行為，也不會取代 `register(...)`、`setupEntry` 或其他執行階段/Plugin 進入點。目前的消費端會在較廣泛載入 Plugin 前，將它用作縮小範圍的提示，因此缺少非啟動階段的啟用中繼資料通常只會影響效能；只要資訊清單擁有權回退仍存在，就不應改變正確性。

每個 Plugin 都應有意識地設定 `activation.onStartup`。只有在 Plugin 必須於 Gateway 啟動期間執行時，才將其設為 `true`。當 Plugin 在啟動時為惰性，且只應由更窄的觸發條件載入時，將其設為 `false`。省略 `onStartup` 不再隱含於啟動時載入 Plugin；請針對啟動、頻道、設定、代理框架、記憶體或其他更窄的啟用觸發條件使用明確的啟用中繼資料。

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

| 欄位               | 必填 | 類型                                                 | 意義                                                                                                                                                                            |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的 Gateway 啟動啟用。每個 Plugin 都應設定此欄位。`true` 會在啟動期間匯入 Plugin；`false` 會讓它在啟動時保持惰性，除非另一個相符觸發條件需要載入。 |
| `onProviders`      | 否   | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的提供者 ID。                                                                                                                                    |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的內嵌代理框架執行階段 ID。CLI 後端別名請使用頂層 `cliBackends`。                                                                              |
| `onCommands`       | 否   | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的命令 ID。                                                                                                                                      |
| `onChannels`       | 否   | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的頻道 ID。                                                                                                                                      |
| `onRoutes`         | 否   | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的路由種類。                                                                                                                                     |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未被明確停用時，應將此 Plugin 納入啟動/載入計畫的相對根目錄設定路徑。                                                                                              |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時優先使用更窄的欄位。                                                                                                                 |

目前的即時消費端：

- Gateway 啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入
- 命令觸發的 CLI 規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 代理執行階段啟動規劃會將 `activation.onAgentHarnesses` 用於內嵌框架，並將頂層 `cliBackends[]` 用於 CLI 執行階段別名
- 頻道觸發的 setup/頻道規劃，在缺少明確頻道啟用中繼資料時，會退回使用舊版 `channels[]` 擁有權
- 啟動 Plugin 規劃會將 `activation.onConfigPaths` 用於非頻道根設定介面，例如內建瀏覽器 Plugin 的 `browser` 區塊
- 提供者觸發的 setup/執行階段規劃，在缺少明確提供者啟用中繼資料時，會退回使用舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權

規劃器診斷可以區分明確啟用提示與資訊清單擁有權回退。例如，`activation-command-hint` 代表 `activation.onCommands` 相符，而 `manifest-command-alias` 代表規劃器改用 `commandAliases` 擁有權。這些原因標籤供主機診斷與測試使用；Plugin 作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當 Plugin 在共用的 `openclaw qa` 根命令底下提供一個或多個傳輸執行器時，請使用 `qaRunners`。請讓此中繼資料保持低成本且靜態；Plugin 執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際 CLI 註冊，該介面會匯出 `qaRunnerCliRegistrations`。

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

| 欄位          | 必填 | 類型     | 意義                                                         |
| ------------- | ---- | -------- | ------------------------------------------------------------ |
| `commandName` | 是   | `string` | 掛載在 `openclaw qa` 底下的子命令，例如 `matrix`。           |
| `description` | 否   | `string` | 共用主機需要 stub 命令時使用的回退說明文字。                 |

## setup 參考

當 setup 與 onboarding 介面需要在執行階段載入前取得低成本、由 Plugin 擁有的中繼資料時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並會繼續描述 CLI 推斷後端。`setup.cliBackends` 是 setup 專用的描述器介面，供應保持僅中繼資料的控制平面/setup 流程使用。

存在時，`setup.providers` 和 `setup.cliBackends` 是 setup 探索偏好的描述器優先查詢介面。如果描述器只縮小候選 Plugin 範圍，而 setup 仍需要更豐富的 setup 時期執行階段 hooks，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為回退執行路徑。

OpenClaw 也會在通用提供者驗證與環境變數查詢中納入 `setup.providers[].envVars`。在棄用期間，`providerAuthEnvVars` 仍透過相容性配接器受到支援，但仍使用它的非內建 Plugin 會收到資訊清單診斷。新的 Plugin 應將 setup/status 環境中繼資料放在 `setup.providers[].envVars`。

當沒有 setup 進入點可用，或 `setup.requiresRuntime: false` 宣告不需要 setup 執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的 setup 選項。對於自訂標籤、CLI 旗標、onboarding 範圍與助理中繼資料，明確的 `providerAuthChoices` 項目仍是優先選擇。

只有在那些描述器足以支援 setup 介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述器契約，且不會為 setup 查詢執行 `setup-api` 或 `openclaw.setupEntry`。如果僅描述器 Plugin 仍附帶其中一種 setup 執行階段進入點，OpenClaw 會回報附加診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版回退行為，讓已加入描述器但未加入此旗標的現有 Plugin 不會中斷。

由於 setup 查詢可以執行由 Plugin 擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必須在已探索的 Plugin 之間保持唯一。擁有權不明確時會失敗關閉，而不是依探索順序挑選勝出者。

當 setup 執行階段確實執行時，如果 `setup-api` 註冊了資訊清單描述器未宣告的提供者或 CLI 後端，或某個描述器沒有相符的執行階段註冊，setup 登錄診斷會回報描述器漂移。這些診斷是附加性的，不會拒絕舊版 Plugin。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 意義                                                                                      |
| -------------- | ---- | ---------- | ----------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | setup 或 onboarding 期間公開的提供者 ID。請讓正規化 ID 在全域保持唯一。                   |
| `authMethods`  | 否   | `string[]` | 此提供者在不載入完整執行階段的情況下支援的 setup/驗證方法 ID。                            |
| `envVars`      | 否   | `string[]` | 通用 setup/status 介面可在 Plugin 執行階段載入前檢查的環境變數。                          |
| `authEvidence` | 否   | `object[]` | 針對可透過非秘密標記驗證的提供者，執行低成本本機驗證證據檢查。                            |

`authEvidence` 用於 provider 擁有的本機憑證標記，這些標記可以在不載入執行階段程式碼的情況下驗證。這些檢查必須保持低成本且限於本機：不得進行網路呼叫、不得讀取 keychain 或祕密管理器、不得執行 shell 命令，也不得探測 provider API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 意義                                                                                                           |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | 否   | `string`   | 包含明確憑證檔案路徑的環境變數。                                                                               |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。                         |
| `requiresAnyEnv`   | 否   | `string[]` | 在證據有效之前，列出的環境變數至少必須有一個非空。                                                             |
| `requiresAllEnv`   | 否   | `string[]` | 在證據有效之前，列出的每個環境變數都必須非空。                                                                 |
| `credentialMarker` | 是   | `string`   | 證據存在時傳回的非祕密標記。                                                                                   |
| `source`           | 否   | `string`   | 用於驗證/狀態輸出的使用者可見來源標籤。                                                                        |

### setup 欄位

| 欄位               | 必填 | 類型       | 意義                                                                                              |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在設定和 onboarding 期間公開的 provider 設定描述項。                                              |
| `cliBackends`      | 否   | `string[]` | 設定期間用於描述項優先設定查找的後端 ID。請保持正規化 ID 在全域唯一。                             |
| `configMigrations` | 否   | `string[]` | 此 Plugin 設定介面擁有的 config 遷移 ID。                                                         |
| `requiresRuntime`  | 否   | `boolean`  | 描述項查找後，設定是否仍需要執行 `setup-api`。                                                     |

## uiHints 參考

`uiHints` 是從 config 欄位名稱到小型呈現提示的映射。

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
| `label`       | `string`   | 使用者可見的欄位標籤。       |
| `help`        | `string`   | 簡短的輔助文字。             |
| `tags`        | `string[]` | 選用的 UI 標籤。             |
| `advanced`    | `boolean`  | 將欄位標記為進階。           |
| `sensitive`   | `boolean`  | 將欄位標記為祕密或敏感。     |
| `placeholder` | `string`   | 表單輸入的 placeholder 文字。 |

## contracts 參考

僅將 `contracts` 用於靜態功能擁有權中繼資料，OpenClaw 可以在不匯入 Plugin 執行階段的情況下讀取這些資料。

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
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 擴充功能工廠 ID，目前為 `codex-app-server`。          |
| `agentToolResultMiddleware`      | `string[]` | bundled Plugin 可為其註冊工具結果 middleware 的執行階段 ID。          |
| `externalAuthProviders`          | `string[]` | 此 Plugin 擁有其外部驗證設定檔 hook 的 provider ID。                  |
| `speechProviders`                | `string[]` | 此 Plugin 擁有的語音 provider ID。                                    |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 擁有的即時轉錄 provider ID。                                |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 擁有的即時語音 provider ID。                                |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 擁有的記憶體嵌入 provider ID。                              |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 擁有的媒體理解 provider ID。                                |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 擁有的圖像生成 provider ID。                                |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 擁有的影片生成 provider ID。                                |
| `webFetchProviders`              | `string[]` | 此 Plugin 擁有的 Web 擷取 provider ID。                               |
| `webSearchProviders`             | `string[]` | 此 Plugin 擁有的 Web 搜尋 provider ID。                               |
| `migrationProviders`             | `string[]` | 此 Plugin 為 `openclaw migrate` 擁有的匯入 provider ID。               |
| `tools`                          | `string[]` | 此 Plugin 擁有的 agent 工具名稱。                                     |

`contracts.embeddedExtensionFactories` 保留給 bundled Codex 僅 app-server 的擴充功能工廠。Bundled 工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。外部 Plugin 無法註冊工具結果 middleware，因為此 seam 可以在模型看到高信任工具輸出之前重寫它。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，只載入可擁有所要求工具的 Plugin 執行階段。

實作 `resolveExternalAuthProfiles` 的 provider Plugin 應宣告 `contracts.externalAuthProviders`。沒有此宣告的 Plugin 仍會透過已棄用的相容性 fallback 執行，但該 fallback 較慢，且會在遷移窗口後移除。

Bundled 記憶體嵌入 provider 應為其公開的每個 adapter ID 宣告 `contracts.memoryEmbeddingProviders`，包括 `local` 等內建 adapter。獨立 CLI 路徑會使用此 manifest contract，在完整 Gateway 執行階段註冊 provider 之前，只載入擁有者 Plugin。

## mediaUnderstandingProviderMetadata 參考

當媒體理解 provider 有預設模型、自動驗證 fallback 優先順序，或泛用 core helper 在執行階段載入前需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須宣告於 `contracts.mediaUnderstandingProviders`。

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

每個 provider 項目可以包含：

| 欄位                   | 類型                                | 意義                                                                          |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此 provider 公開的媒體功能。                                                  |
| `defaultModels`        | `Record<string, string>`            | 當 config 未指定模型時使用的功能到模型預設值。                                |
| `autoPriority`         | `Record<string, number>`            | 數字越小，在自動基於憑證的 provider fallback 中排序越前。                     |
| `nativeDocumentInputs` | `"pdf"[]`                           | provider 支援的原生文件輸入。                                                 |

## channelConfigs 參考

當 channel Plugin 需要在執行階段載入前取得低成本 config 中繼資料時，請使用 `channelConfigs`。唯讀 channel 設定/狀態探索可以在沒有設定項目可用時，或當 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，直接將此中繼資料用於已設定的外部 channel。

`channelConfigs` 是 Plugin manifest 中繼資料，不是新的頂層使用者 config 區段。使用者仍會在 `channels.<channel-id>` 下設定 channel 實例。OpenClaw 會讀取 manifest 中繼資料，以在 Plugin 執行階段程式碼執行之前判斷哪個 Plugin 擁有該已設定的 channel。

對於 channel Plugin，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非 bundled Plugin 也應宣告相符的 `channelConfigs` 項目。沒有這些項目時，OpenClaw 仍可載入 Plugin，但 cold-path config schema、設定和 Control UI 介面在 Plugin 執行階段執行前，無法知道 channel 擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以為 channel 執行階段載入前執行的命令 config 檢查宣告靜態 `auto` 預設值。Bundled channel 也可以在 `package.json#openclaw.channel.commands` 中，與其他 package 擁有的 channel catalog 中繼資料一併發布相同預設值。

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

每個 channel 項目可以包含：

| 欄位          | 類型                     | 含義                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個宣告的通道設定項目都需要。                           |
| `uiHints`     | `Record<string, object>` | 該通道設定區段的選用 UI 標籤、預留位置或敏感提示。                                       |
| `label`       | `string`                 | 執行階段中繼資料尚未就緒時，合併到選擇器與檢視介面的通道標籤。                          |
| `description` | `string`                 | 用於檢視與目錄介面的簡短通道描述。                                                       |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。                          |
| `preferOver`  | `string[]`               | 此通道在選取介面中應優先於的舊版或較低優先順序 Plugin id。                               |

### 取代另一個通道 Plugin

當你的 Plugin 是某個通道 id 的偏好擁有者，而另一個 Plugin 也能提供該通道 id 時，
請使用 `preferOver`。常見情況包括重新命名的 Plugin id、取代內建 Plugin 的獨立
Plugin，或為了設定相容性而保留相同通道 id 的維護版分支。

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

當設定了 `channels.chat` 時，OpenClaw 會同時考量通道 id 與偏好的 Plugin id。
如果較低優先順序的 Plugin 只是因為它是內建或預設啟用而被選取，OpenClaw 會在有效的
執行階段設定中停用它，讓一個 Plugin 擁有該通道及其工具。明確的使用者選取仍然優先：
如果使用者明確啟用兩個 Plugin，OpenClaw 會保留該選擇，並回報重複的通道/工具診斷，
而不是靜默變更要求的 Plugin 集合。

請將 `preferOver` 限定於真正能提供相同通道的 Plugin id。
它不是一般優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在 Plugin 執行階段載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6`
這類簡寫模型 id 推斷你的供應商 Plugin 時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用以下優先順序：

- 明確的 `provider/model` 參照會使用所屬 `providers` 清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非內建 Plugin 與一個內建 Plugin 都相符，非內建 Plugin 優先
- 剩餘的模稜兩可會被忽略，直到使用者或設定指定供應商

欄位：

| 欄位            | 類型       | 含義                                                                              |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 與簡寫模型 id 比對的前綴。                                      |
| `modelPatterns` | `string[]` | 在移除設定檔尾碼後，用於比對簡寫模型 id 的正規表示式來源。                       |

## modelCatalog 參考

當 OpenClaw 應在載入 Plugin 執行階段前知道供應商模型中繼資料時，請使用
`modelCatalog`。這是由清單擁有的來源，用於固定目錄列、供應商別名、抑制規則與探索模式。
執行階段重新整理仍屬於供應商執行階段程式碼，但清單會告訴核心何時需要執行階段。

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
| `providers`    | `Record<string, object>`                                 | 此 Plugin 擁有的供應商 id 目錄列。鍵也應出現在頂層 `providers` 中。                                        |
| `aliases`      | `Record<string, object>`                                 | 應解析為所擁有供應商的供應商別名，用於目錄或抑制規劃。                                                     |
| `suppressions` | `object[]`                                               | 此 Plugin 基於供應商特定原因而抑制的其他來源模型列。                                                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 供應商目錄是否可從清單中繼資料讀取、重新整理到快取，或需要執行階段。                                      |

`aliases` 會參與模型目錄規劃的供應商擁有權查找。
別名目標必須是由同一個 Plugin 擁有的頂層供應商。當依供應商篩選的清單使用別名時，
OpenClaw 可以讀取擁有者清單並套用別名 API/base URL 覆寫，而不必載入供應商執行階段。
別名不會展開未篩選的目錄清單；廣泛清單只會發出擁有者的標準供應商列。

`suppressions` 會取代舊的供應商執行階段 `suppressBuiltInModel` hook。
只有在供應商由該 Plugin 擁有，或宣告為以擁有的供應商為目標的 `modelCatalog.aliases`
鍵時，抑制項目才會生效。模型解析期間不再呼叫執行階段抑制 hook。

供應商欄位：

| 欄位      | 類型                     | 含義                                                                    |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此供應商目錄中模型的選用預設基礎 URL。                                 |
| `api`     | `ModelApi`               | 此供應商目錄中模型的選用預設 API 配接器。                              |
| `headers` | `Record<string, string>` | 套用到此供應商目錄的選用靜態標頭。                                     |
| `models`  | `object[]`               | 必要的模型列。沒有 `id` 的列會被忽略。                                  |

模型欄位：

| 欄位            | 類型                                                           | 含義                                                                                  |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 供應商本地模型 id，不含 `provider/` 前綴。                                            |
| `name`          | `string`                                                       | 選用顯示名稱。                                                                        |
| `api`           | `ModelApi`                                                     | 選用的個別模型 API 覆寫。                                                            |
| `baseUrl`       | `string`                                                       | 選用的個別模型基礎 URL 覆寫。                                                        |
| `headers`       | `Record<string, string>`                                       | 選用的個別模型靜態標頭。                                                            |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                                                      |
| `reasoning`     | `boolean`                                                      | 模型是否公開推理行為。                                                                |
| `contextWindow` | `number`                                                       | 原生供應商內容窗口。                                                                  |
| `contextTokens` | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段內容上限。                            |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出 Token 數。                                                          |
| `cost`          | `object`                                                       | 選用的每百萬 Token 美元價格，包括選用的 `tieredPricing`。                            |
| `compat`        | `object`                                                       | 符合 OpenClaw 模型設定相容性的選用相容性旗標。                                       |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有在該列完全不應出現時才抑制。                                           |
| `statusReason`  | `string`                                                       | 與非可用狀態一起顯示的選用原因。                                                     |
| `replaces`      | `string[]`                                                     | 此模型取代的較舊供應商本地模型 id。                                                  |
| `replacedBy`    | `string`                                                       | 已棄用列的替代供應商本地模型 id。                                                    |
| `tags`          | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                                       |

抑制欄位：

| 欄位                       | 類型       | 含義                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列供應商 id。必須由此 Plugin 擁有，或宣告為所擁有的別名。                                   |
| `model`                    | `string`   | 要抑制的供應商本地模型 id。                                                                               |
| `reason`                   | `string`   | 直接要求被抑制列時顯示的選用訊息。                                                                        |
| `when.baseUrlHosts`        | `string[]` | 抑制生效前所需的有效供應商基礎 URL 主機選用清單。                                                        |
| `when.providerConfigApiIn` | `string[]` | 抑制生效前所需的精確供應商設定 `api` 值選用清單。                                                        |

不要將僅限執行階段的資料放入 `modelCatalog`。只有在 manifest
列已完整到足以讓提供者篩選清單與選擇器介面略過
registry/runtime discovery 時，才使用 `static`。當 manifest 列是有用的
可列出種子或補充資料，但 refresh/cache 之後可以加入更多列時，使用
`refreshable`；refreshable 列本身並非權威來源。當 OpenClaw
必須載入提供者 runtime 才能得知清單時，使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、由提供者擁有的 model-id 清理，且必須
在提供者 runtime 載入前發生。這會將短模型名稱、提供者本地舊版 id，
以及 proxy prefix 規則等別名保留在所屬 Plugin manifest 中，而不是放在核心
model-selection 表內。

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

| 欄位                                 | 類型                    | 意義                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確 model-id 別名。值會以原樣傳回。                                        |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版 provider/model 重複情況。                              |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 id 尚未包含 `/` 時要加入的前綴。                                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式 bare-id 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。                  |

## providerEndpoints 參考

使用 `providerEndpoints` 進行端點分類，讓通用請求政策能在提供者 runtime 載入前
得知。核心仍然擁有每個 `endpointClass` 的意義；Plugin manifests 擁有 host 與
base URL 中繼資料。

端點欄位：

| 欄位                           | 類型       | 意義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                    |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                                 |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機尾碼。以 `.` 作為前綴可只比對網域尾碼。                                   |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) base URL。                                                  |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機中移除的尾碼，用來公開 Google Vertex 區域前綴。                                      |

## providerRequest 參考

使用 `providerRequest` 放置低成本的請求相容性中繼資料，讓通用
請求政策無需載入提供者 runtime 即可使用。將行為特定的
payload 重寫保留在提供者 runtime hooks 或共享的提供者家族 helpers 中。

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

| 欄位                  | 類型         | 意義                                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | 通用請求相容性決策與診斷使用的提供者家族標籤。                                      |
| `compatibilityFamily` | `"moonshot"` | 選用的提供者家族相容性分組，供共享請求 helpers 使用。                               |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。                  |

## modelPricing 參考

當提供者需要在 runtime 載入前控制控制平面的定價行為時，使用
`modelPricing`。Gateway 定價快取會讀取此中繼資料，而不匯入
提供者 runtime 程式碼。

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

| 欄位         | 類型              | 意義                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對本機/自架提供者設為 `false`，使其永遠不擷取 OpenRouter 或 LiteLLM 定價。                            |
| `openRouter` | `false \| object` | OpenRouter 定價查找對應。`false` 會停用此提供者的 OpenRouter 查找。                                   |
| `liteLLM`    | `false \| object` | LiteLLM 定價查找對應。`false` 會停用此提供者的 LiteLLM 查找。                                         |

來源欄位：

| 欄位                       | 類型               | 意義                                                                                                                   |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 id 與 OpenClaw 提供者 id 不同時使用，例如 `zai` 提供者的 `z-ai`。                                      |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 id 視為巢狀 provider/model 參照，適用於 OpenRouter 這類 proxy 提供者。                                |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄 model-id 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的 dotted version ids。                         |

### OpenClaw 提供者索引

OpenClaw 提供者索引是 OpenClaw 擁有的提供者預覽中繼資料，
適用於 Plugin 可能尚未安裝的提供者。它不是 Plugin manifest 的一部分。
Plugin manifests 仍是已安裝 Plugin 的權威來源。提供者索引是
內部 fallback 合約，未來的可安裝提供者與安裝前模型選擇器介面會在提供者 Plugin
未安裝時使用它。

目錄權威順序：

1. 使用者設定。
2. 已安裝 Plugin manifest `modelCatalog`。
3. 來自明確 refresh 的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

提供者索引不得包含秘密、啟用狀態、runtime hooks，或
即時帳號特定模型資料。其預覽目錄使用與 Plugin manifests 相同的
`modelCatalog` 提供者列形狀，但除非有意讓 `api`、`baseUrl`、
定價或相容性旗標等 runtime adapter 欄位與已安裝 Plugin manifest 保持一致，
否則應限於穩定的顯示中繼資料。具有即時 `/models` discovery 的提供者，應透過
明確模型目錄快取路徑寫入重新整理後的列，而不是讓一般列表或 onboarding 呼叫
提供者 API。

提供者索引項目也可以攜帶可安裝 Plugin 中繼資料，適用於 Plugin 已移出核心或
尚未安裝的提供者。此中繼資料鏡像 channel catalog 模式：套件名稱、npm 安裝規格、
預期完整性，以及低成本 auth-choice 標籤，足以顯示可安裝的設定選項。
一旦 Plugin 安裝完成，其 manifest 會勝出，而該提供者的提供者索引項目會被忽略。

舊版頂層 capability keys 已棄用。使用 `openclaw doctor --fix` 將
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 之下；一般
manifest 載入不再將這些頂層欄位視為 capability ownership。

## Manifest 與 package.json

這兩個檔案用途不同：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | discovery、設定驗證、auth-choice 中繼資料，以及必須在 Plugin 程式碼執行前存在的 UI 提示                                         |
| `package.json`         | npm 中繼資料、相依套件安裝，以及用於 entrypoints、安裝閘門、設定或目錄中繼資料的 `openclaw` 區塊                                 |

如果不確定某段中繼資料應放在哪裡，請使用此規則：

- 如果 OpenClaw 必須在載入 Plugin 程式碼前知道它，請放入 `openclaw.plugin.json`
- 如果它與封裝、進入點檔案或 npm 安裝行為有關，請放入 `package.json`

### 會影響 discovery 的 package.json 欄位

某些 runtime 前 Plugin 中繼資料刻意放在 `package.json` 的
`openclaw` 區塊下，而不是 `openclaw.plugin.json`。
`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw Plugin 合約；
原生 Plugin 必須使用 `openclaw.plugin.json` 加上下方支援的
`package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 意義                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | 宣告原生 Plugin 進入點。必須留在 Plugin 套件目錄內。                                                                                                                                 |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須留在 Plugin 套件目錄內。                                                                                                      |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定進入點，用於導入、延後通道啟動，以及唯讀通道狀態/SecretRef 探索。必須留在 Plugin 套件目錄內。                                                                            |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的建置後 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須留在 Plugin 套件目錄內。                                                                            |
| `openclaw.channel`                                                                         | 低成本通道目錄中繼資料，例如標籤、文件路徑、別名與選擇文案。                                                                                                                        |
| `openclaw.channel.commands`                                                                | 在通道執行階段載入前，由設定、稽核與命令清單介面使用的靜態原生命令與原生 skill 自動預設中繼資料。                                                                                  |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已存在僅 env 的設定？」                                                                                |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 給隨附與外部發布 Plugin 的安裝/更新提示。                                                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | 當有多個安裝來源可用時的偏好安裝路徑。                                                                                                                                              |
| `openclaw.install.minHostVersion`                                                          | 支援的最低 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist integrity 字串，例如 `sha512-...`；安裝與更新流程會用它驗證擷取到的 artifact。                                                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 當設定無效時，允許狹窄的隨附 Plugin 重新安裝復原路徑。                                                                                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 讓僅設定的通道介面在啟動期間先於完整通道 Plugin 載入。                                                                                                                             |

Manifest 中繼資料會決定哪些提供者/通道/設定選項會在執行階段載入前出現在
導入流程中。`package.json#openclaw.install` 會告訴導入流程，當使用者選擇其中一個
選項時，該如何擷取或啟用該 Plugin。不要把安裝提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在安裝期間，以及非隨附 Plugin 來源的 manifest
登錄載入期間強制執行。無效值會被拒絕；較新但有效的值會在較舊主機上略過外部 Plugin。
隨附來源 Plugin 會假定與主機 checkout 共同版本化。

官方的按需安裝中繼資料應在 Plugin 發布於 ClawHub 時使用 `clawhubSpec`；導入流程會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub artifact 事實。`npmSpec` 則保留作為尚未移至 ClawHub 的套件相容性備援。

精確的 npm 版本釘選已存在於 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄項目應將精確 spec 搭配 `expectedIntegrity`，讓更新流程在擷取到的 npm artifact 不再符合釘選 release 時以關閉方式失敗。互動式導入仍會為了相容性提供受信任登錄的 npm spec，包括裸套件名稱與 dist-tag。目錄診斷可區分精確、浮動、已釘選完整性、缺少完整性、套件名稱不相符，以及無效預設選擇來源。當存在 `expectedIntegrity` 但沒有可供釘選的有效 npm 來源時，也會發出警告。
當存在 `expectedIntegrity` 時，安裝/更新流程會強制執行；省略時，登錄解析結果會在沒有完整性釘選的情況下記錄。

當狀態、通道清單或 SecretRef 掃描需要在不載入完整執行階段的情況下識別已設定帳戶時，通道 Plugin 應提供 `openclaw.setupEntry`。設定進入點應公開通道中繼資料，以及設定安全的設定、狀態與 secrets 轉接器；將網路用戶端、Gateway 監聽器與傳輸執行階段保留在主要 extension 進入點中。

執行階段進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 不能讓逸出邊界的 `openclaw.extensions` 路徑變成可載入。

`openclaw.install.allowInvalidConfigRecovery` 的範圍刻意很窄。它不會讓任意損壞的設定都能安裝。如今它只允許安裝流程從特定的過期隨附 Plugin 升級失敗中復原，例如缺少隨附 Plugin 路徑，或該相同隨附 Plugin 的過期 `channels.<id>` 項目。無關的設定錯誤仍會阻擋安裝，並將操作人員導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是提供給極小檢查器模組的套件中繼資料：

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

當設定、doctor、狀態或唯讀 presence 流程需要在完整通道 Plugin 載入前執行低成本的是/否驗證探測時使用它。持久化驗證狀態不是已設定通道狀態：不要使用這項中繼資料來自動啟用 Plugin、修復執行階段依賴，或決定是否應載入通道執行階段。目標 export 應是只讀取持久化狀態的小函式；不要透過完整通道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 對低成本的僅 env 已設定檢查採用相同形狀：

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

當通道可從 env 或其他極小的非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的通道執行階段，請將該邏輯保留在 Plugin `config.hasConfiguredState` hook 中。

## 探索優先順序（重複的 Plugin id）

OpenClaw 會從多個根目錄探索 Plugin（隨附、全域安裝、工作區、明確設定選取的路徑）。如果兩個探索結果共用相同的 `id`，只會保留**最高優先順序**的 manifest；較低優先順序的重複項目會被丟棄，而不是並列載入。

優先順序，由高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **隨附** — 隨 OpenClaw 一起出貨的 Plugin
3. **全域安裝** — 安裝到全域 OpenClaw Plugin 根目錄的 Plugin
4. **工作區** — 相對於目前工作區探索到的 Plugin

影響：

- 放在工作區中的隨附 Plugin 分叉或過期副本不會遮蔽隨附建置。
- 若要實際用本機 Plugin 覆寫隨附 Plugin，請透過 `plugins.entries.<id>` 釘選它，讓它憑藉優先順序勝出，而不是依賴工作區探索。
- 重複項目丟棄會被記錄，讓 Doctor 與啟動診斷能指出被捨棄的副本。
- 設定選取的重複覆寫會在診斷中表述為明確覆寫，但仍會警告，讓過期分叉與意外遮蔽保持可見。

## JSON Schema 要求

- **每個 Plugin 都必須附帶 JSON Schema**，即使它不接受任何設定。
- 空 schema 可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段驗證。
- 使用新設定鍵擴充或分叉隨附 Plugin 時，請同時更新該 Plugin 的 `openclaw.plugin.json` `configSchema`。隨附 Plugin schema 是嚴格的，因此如果在使用者設定中新增 `plugins.entries.<id>.config.myNewKey`，但未將 `myNewKey` 加入 `configSchema.properties`，就會在 Plugin 執行階段載入前被拒絕。

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

- 未知的 `channels.*` 鍵是**錯誤**，除非該通道 id 由 Plugin manifest 宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 與 `plugins.slots.*`
  必須參照**可探索**的 Plugin id。未知 id 是**錯誤**。
- 如果已安裝 Plugin 但 manifest 或 schema 損壞或缺失，
  驗證會失敗，Doctor 會回報該 Plugin 錯誤。
- 如果存在 Plugin 設定但該 Plugin **已停用**，設定會被保留，並且
  Doctor 與日誌中會顯示**警告**。

請參閱[設定參考](/zh-TW/gateway/configuration)以取得完整的 `plugins.*` schema。

## 備註

- manifest 是**原生 OpenClaw Plugin 必需的**，包括本機檔案系統載入。runtime 仍會另外載入 Plugin 模組；manifest 只用於探索 + 驗證。
- 原生 manifest 會以 JSON5 解析，因此只要最終值仍是物件，就接受註解、尾隨逗號和未加引號的鍵。
- manifest 載入器只會讀取已記載的 manifest 欄位。請避免自訂頂層鍵。
- 當 Plugin 不需要時，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必須保持輕量，且不應匯入廣泛的 runtime 程式碼；請將它用於靜態提供者目錄中繼資料或窄範圍探索描述符，而不是請求時執行。
- 專屬 Plugin 類型透過 `plugins.slots.*` 選取：透過 `plugins.slots.memory` 設定 `kind: "memory"`，透過 `plugins.slots.contextEngine` 設定 `kind: "context-engine"`（預設為 `legacy`）。
- 在此 manifest 中宣告專屬 Plugin 類型。runtime 入口 `OpenClawPluginDefinition.kind` 已棄用，僅保留作為舊版 Plugin 的相容性後備。
- 環境變數中繼資料（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅為宣告式。status、audit、Cron delivery validation 和其他唯讀介面在將環境變數視為已設定之前，仍會套用 Plugin 信任與有效啟用政策。
- 對於需要提供者程式碼的 runtime 精靈中繼資料，請參閱 [Provider runtime hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的 Plugin 依賴原生模組，請記載建置步驟和任何套件管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關內容

<CardGroup cols={3}>
  <Card title="建置 Plugin" href="/zh-TW/plugins/building-plugins" icon="rocket">
    開始使用 Plugin。
  </Card>
  <Card title="Plugin 架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構和能力模型。
  </Card>
  <Card title="SDK 概覽" href="/zh-TW/plugins/sdk-overview" icon="book">
    Plugin SDK 參考和子路徑匯入。
  </Card>
</CardGroup>
