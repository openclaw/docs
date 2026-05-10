---
read_when:
    - 你正在建置一個 OpenClaw Plugin
    - 你需要發布 Plugin 設定結構描述或偵錯 Plugin 驗證錯誤
summary: Plugin 清單 + JSON 結構描述需求（嚴格設定驗證）
title: Plugin 資訊清單
x-i18n:
    generated_at: "2026-05-10T19:43:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

此頁僅適用於 **原生 OpenClaw Plugin manifest**。

如需相容的 bundle 版面配置，請參閱 [Plugin bundles](/zh-TW/plugins/bundles)。

相容的 bundle 格式使用不同的 manifest 檔案：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不含 manifest 的預設 Claude component
  版面配置
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些 bundle 版面配置，但它們不會依據此處描述的
`openclaw.plugin.json` schema 進行驗證。

對於相容的 bundle，OpenClaw 目前會在版面配置符合 OpenClaw runtime 預期時，
讀取 bundle metadata 加上宣告的 skill roots、Claude command roots、Claude bundle `settings.json` 預設值、
Claude bundle LSP 預設值，以及支援的 hook packs。

每個原生 OpenClaw Plugin **都必須** 在 **Plugin root** 中隨附 `openclaw.plugin.json` 檔案。
OpenClaw 會使用此 manifest 來驗證設定，
**不執行 Plugin code**。缺少或無效的 manifest 會被視為
Plugin 錯誤，並阻擋 config validation。

請參閱完整的 Plugin system guide：[Plugins](/zh-TW/tools/plugin)。
如需原生 capability model 與目前的外部相容性指引：
[Capability model](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的
Plugin code 之前**讀取的 metadata。以下所有內容都必須足夠輕量，才能在不啟動
Plugin runtime 的情況下檢查。

**用於：**

- Plugin 身分識別、config validation，以及 config UI 提示
- auth、onboarding 和 setup metadata（alias、auto-enable、provider env vars、auth choices）
- control-plane surfaces 的 activation hints
- shorthand model-family ownership
- static capability-ownership snapshots（`contracts`）
- shared `openclaw qa` host 可檢查的 QA runner metadata
- 合併到 catalog 和 validation surfaces 的 channel-specific config metadata

**請勿用於：** 註冊 runtime behavior、宣告 code entrypoints，
或 npm install metadata。這些應放在你的 Plugin code 和 `package.json` 中。

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

| 欄位                                 | 必填 | 類型                             | 含義                                                                                                                                                                                                                       |
| ------------------------------------ | ---- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 標準 Plugin id。這是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                 |
| `configSchema`                       | 是   | `object`                         | 此 Plugin 設定的內嵌 JSON Schema。                                                                                                                                                                                        |
| `enabledByDefault`                   | 否   | `true`                           | 將內建 Plugin 標記為預設啟用。省略此欄位，或設定任何非 `true` 值，即可讓 Plugin 預設停用。                                                                                                        |
| `enabledByDefaultOnPlatforms`        | 否   | `string[]`                       | 僅在列出的 Node.js 平台上將內建 Plugin 標記為預設啟用，例如 `["darwin"]`。明確設定仍會優先。                                                                                            |
| `legacyPluginIds`                    | 否   | `string[]`                       | 會正規化為此標準 Plugin id 的舊版 id。                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 當驗證、設定或模型 refs 提及這些 Provider id 時，應自動啟用此 Plugin 的 Provider id。                                                                                                                                     |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 宣告由 `plugins.slots.*` 使用的互斥 Plugin 類型。                                                                                                                                                                        |
| `channels`                           | 否   | `string[]`                       | 此 Plugin 擁有的 Channel id。用於探索與設定驗證。                                                                                                                                                         |
| `providers`                          | 否   | `string[]`                       | 此 Plugin 擁有的 Provider id。                                                                                                                                                                                                  |
| `providerCatalogEntry`               | 否   | `string`                         | 輕量 Provider 目錄模組路徑，相對於 Plugin 根目錄，用於無需啟用完整 Plugin 執行階段即可載入的 manifest 範圍 Provider 目錄中繼資料。                                                 |
| `modelSupport`                       | 否   | `object`                         | Manifest 擁有的模型系列簡寫中繼資料，用於在執行階段前自動載入 Plugin。                                                                                                                                         |
| `modelCatalog`                       | 否   | `object`                         | 此 Plugin 擁有的 Provider 的宣告式模型目錄中繼資料。這是未來唯讀列出、onboarding、模型選擇器、別名與抑制功能的控制平面合約，無需載入 Plugin 執行階段。         |
| `modelPricing`                       | 否   | `object`                         | Provider 擁有的外部定價查詢政策。用它讓本機/自架 Provider 選擇退出遠端定價目錄，或將 Provider refs 對應到 OpenRouter/LiteLLM 目錄 id，而不必在核心中硬編碼 Provider id。             |
| `modelIdNormalization`               | 否   | `object`                         | Provider 擁有的模型 id 別名/前綴清理，必須在 Provider 執行階段載入前執行。                                                                                                                                           |
| `providerEndpoints`                  | 否   | `object[]`                       | Manifest 擁有的 endpoint host/baseUrl 中繼資料，用於核心必須在 Provider 執行階段載入前分類的 Provider 路由。                                                                                                            |
| `providerRequest`                    | 否   | `object`                         | 由通用請求政策在 Provider 執行階段載入前使用的低成本 Provider 系列與請求相容性中繼資料。                                                                                                              |
| `cliBackends`                        | 否   | `string[]`                       | 此 Plugin 擁有的 CLI 推論後端 id。用於從明確設定 refs 啟動時自動啟用。                                                                                                                         |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | Provider 或 CLI 後端 refs，其 Plugin 擁有的 synthetic auth hook 應在執行階段載入前的 cold 模型探索期間被探測。                                                                                              |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 內建 Plugin 擁有的預留位置 API key 值，代表非機密的本機、OAuth 或環境憑證狀態。                                                                                                                |
| `commandAliases`                     | 否   | `object[]`                       | 此 Plugin 擁有的命令名稱，應在執行階段載入前產生具 Plugin 感知能力的設定與 CLI 診斷。                                                                                                                |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 已棄用的相容性 env 中繼資料，用於 Provider 驗證/狀態查詢。新 Plugin 請偏好使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此欄位。                                                 |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 應重用另一個 Provider id 進行驗證查詢的 Provider id，例如共享基礎 Provider API key 與驗證設定檔的編碼 Provider。                                                                          |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 可在不載入 Plugin 程式碼的情況下檢查的低成本 Channel env 中繼資料。用於通用啟動/設定輔助程式應看見的 env 驅動 Channel 設定或驗證介面。                                            |
| `providerAuthChoices`                | 否   | `object[]`                       | 用於 onboarding 選擇器、偏好 Provider 解析與簡單 CLI 旗標接線的低成本驗證選項中繼資料。                                                                                                                       |
| `activation`                         | 否   | `object`                         | 用於啟動、Provider、命令、Channel、路由與能力觸發載入的低成本啟用規劃器中繼資料。僅為中繼資料；Plugin 執行階段仍擁有實際行為。                                                       |
| `setup`                              | 否   | `object`                         | 低成本設定/onboarding 描述項，探索與設定介面可在不載入 Plugin 執行階段的情況下檢查。                                                                                                                    |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` host 在 Plugin 執行階段載入前使用的低成本 QA runner 描述項。                                                                                                                                      |
| `contracts`                          | 否   | `object`                         | 外部驗證 hook、語音、即時轉錄、即時語音、媒體理解、影像生成、音樂生成、影片生成、web-fetch、web search 與 tool ownership 的靜態能力所有權快照。 |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 針對 `contracts.mediaUnderstandingProviders` 中宣告的 Provider id 的低成本媒體理解預設值。                                                                                                                            |
| `imageGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 針對 `contracts.imageGenerationProviders` 中宣告的 Provider id 的低成本影像生成驗證中繼資料，包括 Provider 擁有的驗證別名與 base-url guard。                                                                  |
| `videoGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 針對 `contracts.videoGenerationProviders` 中宣告的 Provider id 的低成本影片生成驗證中繼資料，包括 Provider 擁有的驗證別名與 base-url guard。                                                                  |
| `musicGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 針對 `contracts.musicGenerationProviders` 中宣告的 Provider id 的低成本音樂生成驗證中繼資料，包括 Provider 擁有的驗證別名與 base-url guard。                                                                  |
| `toolMetadata`                       | 否   | `Record<string, object>`         | 針對 `contracts.tools` 中宣告且 Plugin 擁有的工具的低成本可用性中繼資料。當工具除非存在設定、env 或驗證證據，否則不應載入執行階段時使用。                                                           |
| `channelConfigs`                     | 否   | `Record<string, object>`         | Manifest 擁有的 Channel 設定中繼資料，會在執行階段載入前合併到探索與驗證介面中。                                                                                                                          |
| `skills`                             | 否   | `string[]`                       | 要載入的 Skill 目錄，相對於 Plugin 根目錄。                                                                                                                                                                             |
| `name`                               | 否       | `string`                         | 人類可讀的 Plugin 名稱。                                                                                                                                                                                                         |
| `description`                        | 否       | `string`                         | 顯示於 Plugin 介面的簡短摘要。                                                                                                                                                                                             |
| `version`                            | 否       | `string`                         | 資訊用途的 Plugin 版本。                                                                                                                                                                                                       |
| `uiHints`                            | 否       | `Record<string, object>`         | 設定欄位的使用者介面標籤、預留位置和敏感性提示。                                                                                                                                                                   |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述在相符的 `contracts.*GenerationProviders` 清單中宣告的提供者靜態驗證訊號。
OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具可以在不匯入每個提供者 Plugin 的情況下，判斷某個生成提供者是否可用。

這些欄位僅用於低成本、宣告式的事實。傳輸、請求轉換、權杖重新整理、憑證驗證，以及實際的生成行為，都保留在 Plugin 執行階段中。

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

| 欄位            | 必填 | 類型       | 含義                                                                                                                         |
| --------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | 否   | `string[]` | 應算作生成提供者靜態驗證別名的其他提供者 ID。                                                                                |
| `authProviders` | 否   | `string[]` | 其已設定驗證設定檔應算作此生成提供者驗證的提供者 ID。                                                                        |
| `configSignals` | 否   | `object[]` | 針對本機或自託管提供者的低成本、僅設定可用性訊號，可在沒有驗證設定檔或環境變數的情況下設定。                                |
| `authSignals`   | 否   | `object[]` | 明確的驗證訊號。存在時，這些訊號會取代來自提供者 ID、`aliases` 和 `authProviders` 的預設訊號集合。                           |

每個 `configSignals` 項目支援：

| 欄位          | 必填 | 類型       | 含義                                                                                                                                                               |
| ------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | 是   | `string`   | 要檢查的 Plugin 擁有設定物件的點路徑，例如 `plugins.entries.example.config`。                                                                                      |
| `overlayPath` | 否   | `string`   | 根設定內的點路徑，其物件應在評估訊號前覆蓋根物件。請將此用於能力特定設定，例如 `image`、`video` 或 `music`。                                                       |
| `required`    | 否   | `string[]` | 有效設定內必須具備已設定值的點路徑。字串必須非空；物件和陣列不得為空。                                                                                             |
| `requiredAny` | 否   | `string[]` | 有效設定內的點路徑，其中至少一個必須具備已設定值。                                                                                                                 |
| `mode`        | 否   | `object`   | 有效設定內的選用字串模式防護。當僅設定可用性只適用於某一種模式時使用。                                                                                             |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                               |
| ------------ | ---- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                                |
| `default`    | 否   | `string`   | 當設定省略該路徑時使用的模式值。                                                   |
| `allowed`    | 否   | `string[]` | 若存在，只有在有效模式為這些值之一時訊號才會通過。                                 |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式為這些值之一時訊號會失敗。                                       |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                              |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                          |
| `providerBaseUrl` | 否   | `object` | 選用防護，只有當參照的已設定提供者使用允許的基礎 URL 時，才讓訊號計入。當驗證別名只對特定 API 有效時使用。                                       |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                       |
| ----------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的提供者設定 ID。                                                                                                     |
| `defaultBaseUrl`  | 否   | `string`   | 當提供者設定省略 `baseUrl` 時假設的基礎 URL。                                                                                              |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基礎 URL。當已設定或預設基礎 URL 不符合這些正規化值之一時，會忽略該訊號。                                                   |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同形狀的 `configSignals` 和 `authSignals`，並以工具名稱為鍵。`contracts.tools` 宣告所有權。`toolMetadata` 宣告低成本可用性證據，讓 OpenClaw 可以避免只為了讓工具工廠回傳 `null` 而匯入 Plugin 執行階段。

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

如果某個工具沒有 `toolMetadata`，OpenClaw 會保留現有行為，並在工具合約符合政策時載入擁有該工具的 Plugin。對於其工廠依賴驗證/設定的熱路徑工具，Plugin 作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個入門設定或驗證選擇。
OpenClaw 會在提供者執行階段載入前讀取此內容。
提供者設定清單會使用這些資訊清單選擇、從描述元衍生的設定選擇，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                            | 含義                                                                                                  |
| --------------------- | ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此選擇所屬的提供者 ID。                                                                               |
| `method`              | 是   | `string`                                        | 要分派至的驗證方法 ID。                                                                               |
| `choiceId`            | 是   | `string`                                        | 入門設定和 CLI 流程使用的穩定驗證選擇 ID。                                                            |
| `choiceLabel`         | 否   | `string`                                        | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                            |
| `choiceHint`          | 否   | `string`                                        | 選擇器的簡短輔助文字。                                                                                |
| `assistantPriority`   | 否   | `number`                                        | 在助理驅動的互動式選擇器中，較低值會排序在前。                                                        |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 從助理選擇器隱藏此選擇，但仍允許手動 CLI 選取。                                                       |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 應將使用者重新導向到此替代選擇的舊選擇 ID。                                                           |
| `groupId`             | 否   | `string`                                        | 用於群組相關選擇的選用群組 ID。                                                                       |
| `groupLabel`          | 否   | `string`                                        | 該群組面向使用者的標籤。                                                                              |
| `groupHint`           | 否   | `string`                                        | 群組的簡短輔助文字。                                                                                  |
| `optionKey`           | 否   | `string`                                        | 簡單單旗標驗證流程的內部選項鍵。                                                                      |
| `cliFlag`             | 否   | `string`                                        | CLI 旗標名稱，例如 `--openrouter-api-key`。                                                           |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 選項形狀，例如 `--openrouter-api-key <key>`。                                                |
| `cliDescription`      | 否   | `string`                                        | CLI 說明中使用的描述。                                                                                |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此選擇應出現在哪些入門設定介面中。若省略，預設為 `["text-inference"]`。                               |

## commandAliases 參考

Use `commandAliases` 當 Plugin 擁有使用者可能會誤放到 `plugins.allow`，或嘗試當作根 CLI 命令執行的執行階段命令名稱時使用。OpenClaw 會使用這項中繼資料進行診斷，而不匯入 Plugin 執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 含義                                                                    |
| ------------ | ---- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此 Plugin 的命令名稱。                                               |
| `kind`       | 否   | `"runtime-slash"` | 將別名標記為聊天斜線命令，而不是根 CLI 命令。                           |
| `cliCommand` | 否   | `string`          | 若存在，建議用於 CLI 操作的相關根 CLI 命令。                            |

## activation 參考

Use `activation` 當 Plugin 可以低成本宣告哪些控制平面事件應該在啟用/載入計畫中包含它時使用。

這個區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不承諾 Plugin 程式碼已經執行。啟用規劃器會使用這些欄位，在回退到既有清單擁有權中繼資料之前縮小候選 Plugin 範圍，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hook。

優先使用已能描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、setup 描述項或 `contracts` 能表達關係時，使用那些欄位。對於無法由那些擁有權欄位表示的額外規劃器提示，使用 `activation`。
對於 CLI 執行階段別名，例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 只用於尚未有擁有權欄位的內嵌代理 harness ID。

這個區塊僅為中繼資料。它不會註冊執行階段行為，也不會取代 `register(...)`、`setupEntry` 或其他執行階段/Plugin 進入點。目前的消費者會在更廣泛的 Plugin 載入前，將其作為縮小範圍的提示，因此缺少非啟動啟用中繼資料通常只會影響效能；只要清單擁有權回退仍存在，就不應改變正確性。

每個 Plugin 都應有意識地設定 `activation.onStartup`。只有當 Plugin 必須在 Gateway 啟動期間執行時，才將它設為 `true`。當 Plugin 在啟動時為惰性，且應只由更窄的觸發條件載入時，將它設為 `false`。省略 `onStartup` 不再會隱含地在啟動時載入 Plugin；請使用明確的啟用中繼資料來表示啟動、頻道、設定、代理 harness、記憶體或其他更窄的啟用觸發條件。

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

| 欄位               | 必填 | 類型                                                 | 含義                                                                                                                                                                      |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的 Gateway 啟動啟用。每個 Plugin 都應設定此欄位。`true` 會在啟動期間匯入 Plugin；`false` 會讓它在啟動時延遲載入，除非另一個相符觸發條件需要載入。 |
| `onProviders`      | 否   | `string[]`                                           | 應在啟用/載入計畫中包含此 Plugin 的提供者 ID。                                                                                                                           |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應在啟用/載入計畫中包含此 Plugin 的內嵌代理 harness 執行階段 ID。CLI 後端別名請使用頂層 `cliBackends`。                                                                 |
| `onCommands`       | 否   | `string[]`                                           | 應在啟用/載入計畫中包含此 Plugin 的命令 ID。                                                                                                                             |
| `onChannels`       | 否   | `string[]`                                           | 應在啟用/載入計畫中包含此 Plugin 的頻道 ID。                                                                                                                             |
| `onRoutes`         | 否   | `string[]`                                           | 應在啟用/載入計畫中包含此 Plugin 的路由種類。                                                                                                                            |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未明確停用時，應在啟動/載入計畫中包含此 Plugin 的根相對設定路徑。                                                                                            |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時優先使用更窄的欄位。                                                                                                           |

目前的即時消費者：

- Gateway 啟動規劃會使用 `activation.onStartup` 進行明確啟動匯入
- 由命令觸發的 CLI 規劃會回退到舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 代理執行階段啟動規劃會對內嵌 harness 使用 `activation.onAgentHarnesses`，並對 CLI 執行階段別名使用頂層 `cliBackends[]`
- 由頻道觸發的 setup/頻道規劃會在缺少明確頻道啟用中繼資料時，回退到舊版 `channels[]` 擁有權
- 啟動 Plugin 規劃會對非頻道根設定表面使用 `activation.onConfigPaths`，例如內建瀏覽器 Plugin 的 `browser` 區塊
- 由提供者觸發的 setup/執行階段規劃會在缺少明確提供者啟用中繼資料時，回退到舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權

規劃器診斷可以區分明確啟用提示與清單擁有權回退。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤用於主機診斷和測試；Plugin 作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

Use `qaRunners` 當 Plugin 在共用的 `openclaw qa` 根之下貢獻一個或多個傳輸 runner 時使用。保持這項中繼資料低成本且靜態；Plugin 執行階段仍透過輕量的 `runtime-api.ts` 表面擁有實際的 CLI 註冊，該表面會匯出 `qaRunnerCliRegistrations`。

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

| 欄位          | 必填 | 類型     | 含義                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是   | `string` | 掛載在 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 當共用主機需要 stub 命令時使用的後備說明文字。                     |

## setup 參考

Use `setup` 當 setup 和 onboarding 表面需要在執行階段載入前取得低成本、由 Plugin 擁有的中繼資料時使用。

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

頂層 `cliBackends` 仍然有效，並會持續描述 CLI 推論後端。`setup.cliBackends` 是 setup 專用的描述項表面，供應保持僅中繼資料的控制平面/setup 流程使用。

當存在時，`setup.providers` 和 `setup.cliBackends` 是 setup 探索偏好的描述項優先查找表面。如果描述項只縮小候選 Plugin，而 setup 仍需要更豐富的 setup 時執行階段 hook，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為後備執行路徑。

OpenClaw 也會在通用提供者驗證和環境變數查找中包含 `setup.providers[].envVars`。在棄用視窗期間，`providerAuthEnvVars` 仍透過相容性配接器受到支援，但仍使用它的非內建 Plugin 會收到清單診斷。新的 Plugin 應將 setup/狀態環境中繼資料放在 `setup.providers[].envVars`。

OpenClaw 也可以在沒有 setup 進入點可用時，或當 `setup.requiresRuntime: false` 宣告不需要 setup 執行階段時，從 `setup.providers[].authMethods` 推導簡單的 setup 選項。對於自訂標籤、CLI 旗標、onboarding 範圍和助理中繼資料，明確的 `providerAuthChoices` 項目仍是偏好的做法。

只有當那些描述項足以支援 setup 表面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述項合約，且不會為 setup 查找執行 `setup-api` 或 `openclaw.setupEntry`。如果僅描述項 Plugin 仍附帶其中一個 setup 執行階段進入點，OpenClaw 會回報加成式診斷並持續忽略它。省略 `requiresRuntime` 會保留舊版回退行為，讓既有 Plugin 即使已加入描述項但未加入此旗標也不會中斷。

由於 setup 查找可以執行由 Plugin 擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必須在已探索的 Plugin 之間保持唯一。模糊的擁有權會封閉式失敗，而不是從探索順序中挑選勝者。

當 setup 執行階段確實執行時，如果 `setup-api` 註冊了清單描述項未宣告的提供者或 CLI 後端，或某個描述項沒有相符的執行階段註冊，setup 登錄診斷會回報描述項漂移。這些診斷是加成式的，不會拒絕舊版 Plugin。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 含義                                                                                     |
| -------------- | ---- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | setup 或 onboarding 期間公開的提供者 ID。保持正規化 ID 在全域唯一。                     |
| `authMethods`  | 否   | `string[]` | 此提供者在不載入完整執行階段的情況下支援的 setup/auth 方法 ID。                         |
| `envVars`      | 否   | `string[]` | 通用 setup/狀態表面可在 Plugin 執行階段載入前檢查的環境變數。                           |
| `authEvidence` | 否   | `object[]` | 供可透過非秘密標記進行驗證的提供者使用的低成本本機驗證證據檢查。                        |

`authEvidence` 用於由供應器擁有的本機憑證標記，且可在不載入執行階段程式碼的情況下驗證。這些檢查必須維持低成本且在本機執行：不得進行網路呼叫、不得讀取鑰匙圈或秘密管理員、不得執行 shell 命令，也不得探測供應器 API。

支援的證據項目：

| Field              | Required | Type       | What it means                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是       | `string`   | 目前為 `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | 否       | `string`   | 包含明確憑證檔案路徑的環境變數。                                                                               |
| `fallbackPaths`    | 否       | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。                         |
| `requiresAnyEnv`   | 否       | `string[]` | 證據有效之前，列出的環境變數至少必須有一個為非空。                                                             |
| `requiresAllEnv`   | 否       | `string[]` | 證據有效之前，列出的每個環境變數都必須為非空。                                                                 |
| `credentialMarker` | 是       | `string`   | 證據存在時傳回的非秘密標記。                                                                                   |
| `source`           | 否       | `string`   | 用於驗證/狀態輸出的使用者可見來源標籤。                                                                        |

### 設定欄位

| Field              | Required | Type       | What it means                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在設定和 onboarding 期間公開的供應器設定描述元。                                                    |
| `cliBackends`      | 否       | `string[]` | 用於描述元優先設定查找的設定期間後端 ID。請保持正規化 ID 在全域唯一。                               |
| `configMigrations` | 否       | `string[]` | 由此 Plugin 的設定介面擁有的設定遷移 ID。                                                           |
| `requiresRuntime`  | 否       | `boolean`  | 描述元查找後，設定是否仍需要執行 `setup-api`。                                                       |

## uiHints 參考

`uiHints` 是從設定欄位名稱到小型算繪提示的對應。

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

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 使用者可見的欄位標籤。                  |
| `help`        | `string`   | 簡短的輔助文字。                        |
| `tags`        | `string[]` | 選用的 UI 標籤。                        |
| `advanced`    | `boolean`  | 將欄位標記為進階。                      |
| `sensitive`   | `boolean`  | 將欄位標記為秘密或敏感。                |
| `placeholder` | `string`   | 表單輸入的預留位置文字。                |

## contracts 參考

只有在 OpenClaw 可在不匯入 Plugin 執行階段的情況下讀取靜態能力擁有權中繼資料時，才使用 `contracts`。

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

| Field                            | Type       | What it means                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex 應用程式伺服器擴充功能 factory ID，目前為 `codex-app-server`。 |
| `agentToolResultMiddleware`      | `string[]` | 已綑綁 Plugin 可為其註冊工具結果中介軟體的執行階段 ID。              |
| `externalAuthProviders`          | `string[]` | 此 Plugin 擁有其外部驗證設定檔掛鉤的供應器 ID。                      |
| `speechProviders`                | `string[]` | 此 Plugin 擁有的語音供應器 ID。                                       |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 擁有的即時轉錄供應器 ID。                                   |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 擁有的即時語音供應器 ID。                                   |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 擁有的記憶嵌入供應器 ID。                                   |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 擁有的媒體理解供應器 ID。                                   |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 擁有的影像生成供應器 ID。                                   |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 擁有的影片生成供應器 ID。                                   |
| `webFetchProviders`              | `string[]` | 此 Plugin 擁有的 Web 擷取供應器 ID。                                  |
| `webSearchProviders`             | `string[]` | 此 Plugin 擁有的 Web 搜尋供應器 ID。                                  |
| `migrationProviders`             | `string[]` | 此 Plugin 為 `openclaw migrate` 擁有的匯入供應器 ID。                 |
| `tools`                          | `string[]` | 此 Plugin 擁有的代理工具名稱。                                        |

`contracts.embeddedExtensionFactories` 會保留給已綑綁、僅限 Codex 應用程式伺服器的擴充功能 factory。已綑綁的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。外部 Plugin 無法註冊工具結果中介軟體，因為該接縫可在模型看到高信任工具輸出之前改寫它。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，僅載入可擁有所要求工具的 Plugin 執行階段。

實作 `resolveExternalAuthProfiles` 的供應器 Plugin 應宣告 `contracts.externalAuthProviders`。未宣告的 Plugin 仍會透過已棄用的相容性 fallback 執行，但該 fallback 較慢，且會在遷移期間結束後移除。

已綑綁的記憶嵌入供應器應針對其公開的每個配接器 ID 宣告 `contracts.memoryEmbeddingProviders`，包括像 `local` 這類內建配接器。獨立 CLI 路徑會使用此資訊清單契約，在完整 Gateway 執行階段註冊供應器之前，僅載入擁有者 Plugin。

## mediaUnderstandingProviderMetadata 參考

當媒體理解供應器具有預設模型、自動驗證 fallback 優先順序，或通用核心輔助程式在執行階段載入前需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。索引鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

每個供應器項目可包含：

| Field                  | Type                                | What it means                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此供應器公開的媒體能力。                                                     |
| `defaultModels`        | `Record<string, string>`            | 當設定未指定模型時使用的能力對模型預設值。                                   |
| `autoPriority`         | `Record<string, number>`            | 較低數字會在自動憑證式供應器 fallback 中排在較前面。                         |
| `nativeDocumentInputs` | `"pdf"[]`                           | 供應器支援的原生文件輸入。                                                   |

## channelConfigs 參考

當頻道 Plugin 在執行階段載入之前需要低成本設定中繼資料時，請使用 `channelConfigs`。若沒有可用的設定項目，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段，唯讀頻道設定/狀態探索可直接將此中繼資料用於已設定的外部頻道。

`channelConfigs` 是 Plugin 資訊清單中繼資料，不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定頻道執行個體。OpenClaw 會讀取資訊清單中繼資料，以在 Plugin 執行階段程式碼執行前決定哪個 Plugin 擁有該已設定頻道。

對於頻道 Plugin，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非綑綁 Plugin 也應宣告相符的 `channelConfigs` 項目。若沒有這些項目，OpenClaw 仍可載入 Plugin，但冷路徑設定 schema、設定和 Control UI 介面，在 Plugin 執行階段執行之前，無法得知頻道擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可宣告靜態 `auto` 預設值，用於頻道執行階段載入前執行的命令設定檢查。已綑綁頻道也可透過 `package.json#openclaw.channel.commands` 發佈相同預設值，與其其他由套件擁有的頻道目錄中繼資料並列。

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

| 欄位          | 類型                     | 含義                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個宣告的頻道設定項目都必填。                           |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤/預留位置/敏感提示。                                        |
| `label`       | `string`                 | 當執行階段中繼資料尚未就緒時，合併到選擇器和檢查介面的頻道標籤。                        |
| `description` | `string`                 | 用於檢查和目錄介面的簡短頻道描述。                                                       |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令和原生 skill 自動預設值。                           |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於的舊版或較低優先順序 Plugin ID。                              |

### 取代另一個頻道 Plugin

當你的 Plugin 是某個頻道 ID 的偏好擁有者，而另一個 Plugin 也能提供該頻道 ID 時，
請使用 `preferOver`。常見情況包括重新命名的 Plugin ID、取代內建 Plugin 的
獨立 Plugin，或為了設定相容性而保留相同頻道 ID 的維護分支。

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

當設定了 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 和偏好的 Plugin ID。
如果較低優先順序的 Plugin 只是因為它是內建或預設啟用而被選取，
OpenClaw 會在有效的執行階段設定中停用它，讓一個 Plugin 擁有該頻道及其工具。
明確的使用者選擇仍然優先：如果使用者明確啟用兩個 Plugin，OpenClaw 會保留該選擇，
並回報重複的頻道/工具診斷，而不是悄悄變更要求的 Plugin 集合。

請將 `preferOver` 限定於確實能提供相同頻道的 Plugin ID。
它不是通用的優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在 Plugin 執行階段載入前，從像 `gpt-5.5` 或 `claude-sonnet-4.6`
這類簡寫模型 ID 推斷你的提供者 Plugin 時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用以下優先順序：

- 明確的 `provider/model` 參照使用擁有者的 `providers` manifest 中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非內建 Plugin 和一個內建 Plugin 都符合，非內建 Plugin 優先
- 其餘的歧義會被忽略，直到使用者或設定指定提供者

欄位：

| 欄位            | 類型       | 含義                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 與簡寫模型 ID 比對的前綴。                                 |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，與簡寫模型 ID 比對的 Regex 來源。                          |

## modelCatalog 參考

當 OpenClaw 應在載入 Plugin 執行階段前知道提供者模型中繼資料時，
請使用 `modelCatalog`。這是由 manifest 擁有的來源，用於固定目錄列、
提供者別名、抑制規則和探索模式。執行階段重新整理仍屬於提供者執行階段程式碼，
但 manifest 會告訴核心何時需要執行階段。

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

| 欄位           | 類型                                                     | 含義                                                                                              |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此 Plugin 擁有的提供者 ID 目錄列。鍵也應出現在頂層 `providers` 中。                              |
| `aliases`      | `Record<string, object>`                                 | 應解析為所擁有提供者以供目錄或抑制規劃使用的提供者別名。                                        |
| `suppressions` | `object[]`                                               | 此 Plugin 因提供者特定原因而抑制的、來自另一來源的模型列。                                      |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄是否可從 manifest 中繼資料讀取、重新整理到快取，或需要執行階段。                      |

`aliases` 會參與模型目錄規劃的提供者擁有權查找。
別名目標必須是由同一個 Plugin 擁有的頂層提供者。當使用別名的提供者篩選清單時，
OpenClaw 可以讀取擁有者 manifest，並套用別名 API/base URL 覆寫，而不必載入提供者執行階段。
別名不會展開未篩選的目錄清單；廣泛清單只會輸出擁有者的標準提供者列。

`suppressions` 會取代舊的提供者執行階段 `suppressBuiltInModel` hook。
只有當提供者由該 Plugin 擁有，或宣告為指向所擁有提供者的 `modelCatalog.aliases` 鍵時，
抑制項目才會生效。模型解析期間不再呼叫執行階段抑制 hook。

提供者欄位：

| 欄位      | 類型                     | 含義                                                        |
| --------- | ------------------------ | ----------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供者目錄中模型的選用預設基底 URL。                     |
| `api`     | `ModelApi`               | 此提供者目錄中模型的選用預設 API 配接器。                  |
| `headers` | `Record<string, string>` | 套用於此提供者目錄的選用靜態標頭。                         |
| `models`  | `object[]`               | 必填模型列。沒有 `id` 的列會被忽略。                       |

模型欄位：

| 欄位            | 類型                                                           | 含義                                                                      |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供者本機模型 ID，不含 `provider/` 前綴。                                |
| `name`          | `string`                                                       | 選用顯示名稱。                                                            |
| `api`           | `ModelApi`                                                     | 選用的個別模型 API 覆寫。                                                 |
| `baseUrl`       | `string`                                                       | 選用的個別模型基底 URL 覆寫。                                             |
| `headers`       | `Record<string, string>`                                       | 選用的個別模型靜態標頭。                                                  |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                                          |
| `reasoning`     | `boolean`                                                      | 模型是否暴露推理行為。                                                    |
| `contextWindow` | `number`                                                       | 原生提供者內容視窗。                                                      |
| `contextTokens` | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段內容上限。                 |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出 token 數。                                               |
| `cost`          | `object`                                                       | 選用的每百萬 token 美元定價，包括選用的 `tieredPricing`。                 |
| `compat`        | `object`                                                       | 符合 OpenClaw 模型設定相容性的選用相容性旗標。                            |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列出狀態。只有在該列完全不應出現時才抑制。                                |
| `statusReason`  | `string`                                                       | 與非 available 狀態一起顯示的選用原因。                                   |
| `replaces`      | `string[]`                                                     | 此模型取代的較舊提供者本機模型 ID。                                       |
| `replacedBy`    | `string`                                                       | deprecated 列的替代提供者本機模型 ID。                                    |
| `tags`          | `string[]`                                                     | 選擇器和篩選器使用的穩定標籤。                                            |

抑制欄位：

| 欄位                       | 類型       | 含義                                                                                               |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此 Plugin 擁有，或宣告為所擁有的別名。                             |
| `model`                    | `string`   | 要抑制的提供者本機模型 ID。                                                                        |
| `reason`                   | `string`   | 直接要求被抑制的列時顯示的選用訊息。                                                              |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的有效提供者基底 URL 主機選用清單。                                                 |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確提供者設定 `api` 值選用清單。                                                 |

不要將僅供執行階段使用的資料放入 `modelCatalog`。只有在 manifest
列已完整到足以讓依提供者篩選的列表與選擇器介面略過
registry／執行階段探索時，才使用 `static`。當 manifest 列是有用的
可列出種子或補充資料，但重新整理／快取稍後可以加入更多列時，使用
`refreshable`；refreshable 列本身並非權威來源。當 OpenClaw
必須載入提供者執行階段才能知道清單時，使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 執行低成本、由提供者擁有的模型 ID 清理，且該清理必須
在提供者執行階段載入前發生。這會將短模型名稱、提供者本地舊版 ID、
以及代理前綴規則等別名保留在所屬 Plugin manifest 中，而不是放在核心模型選擇表內。

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

| 欄位                                 | 類型                    | 含義                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依寫入方式原樣傳回。                                 |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版提供者／模型重複情況。                                |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                                        |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 作為鍵。                  |

## providerEndpoints 參考

使用 `providerEndpoints` 設定一般請求政策在提供者執行階段載入前必須知道的端點分類。
核心仍然擁有每個 `endpointClass` 的含義；Plugin manifest 擁有主機與基底 URL 中繼資料。

端點欄位：

| 欄位                           | 類型       | 含義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                    |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                                |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機後綴。以 `.` 作為前綴時，僅比對網域後綴。                                |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) 基底 URL。                                                 |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                                       |
| `googleVertexRegionHostSuffix` | `string`   | 從符合的主機移除的後綴，用於公開 Google Vertex 區域前綴。                                    |

## providerRequest 參考

使用 `providerRequest` 提供一般請求政策所需、但不必載入提供者執行階段即可取得的低成本
請求相容性中繼資料。將特定行為的酬載重寫保留在提供者執行階段 hook
或共用的提供者家族輔助程式中。

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

| 欄位                  | 類型         | 含義                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 一般請求相容性決策與診斷使用的提供者家族標籤。                                       |
| `compatibilityFamily` | `"moonshot"` | 共用請求輔助程式的選用提供者家族相容性分組。                                         |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。                   |

## modelPricing 參考

當提供者需要在執行階段載入前控制控制平面定價行為時，使用 `modelPricing`。
Gateway 定價快取會在不匯入提供者執行階段程式碼的情況下讀取此中繼資料。

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

| 欄位         | 類型              | 含義                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對於絕不應抓取 OpenRouter 或 LiteLLM 定價的本機／自託管提供者，設為 `false`。                    |
| `openRouter` | `false \| object` | OpenRouter 定價查找對應。`false` 會停用此提供者的 OpenRouter 查找。                              |
| `liteLLM`    | `false \| object` | LiteLLM 定價查找對應。`false` 會停用此提供者的 LiteLLM 查找。                                    |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                                |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 ID 與 OpenClaw 提供者 ID 不同時使用，例如 `zai` 提供者對應的 `z-ai`。                            |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀提供者／模型參照，適用於 OpenRouter 等代理提供者。                                   |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試像 `claude-opus-4.6` 這類帶點號的版本 ID。                       |

### OpenClaw 提供者索引

OpenClaw 提供者索引是 OpenClaw 擁有的提供者預覽中繼資料，適用於其 Plugin
可能尚未安裝的提供者。它不是 Plugin manifest 的一部分。Plugin manifest
仍是已安裝 Plugin 的權威來源。提供者索引是內部備援契約，未來可安裝提供者與安裝前
模型選擇器介面會在提供者 Plugin 未安裝時使用它。

目錄權威順序：

1. 使用者設定。
2. 已安裝 Plugin manifest `modelCatalog`。
3. 明確重新整理後的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

提供者索引不得包含秘密、啟用狀態、執行階段 hook，或即時帳戶特定模型資料。
其預覽目錄使用與 Plugin manifest 相同的 `modelCatalog` 提供者列形狀，但應限制在
穩定的顯示中繼資料，除非 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位
是刻意與已安裝 Plugin manifest 保持一致。具有即時 `/models` 探索的提供者應透過
明確的模型目錄快取路徑寫入重新整理後的列，而不是讓一般列表或上線流程呼叫提供者 API。

提供者索引項目也可以攜帶可安裝 Plugin 中繼資料，適用於其 Plugin 已移出核心或尚未
安裝的提供者。此中繼資料仿照通道目錄模式：套件名稱、npm 安裝規格、預期完整性，
以及低成本的驗證選項標籤，已足以顯示可安裝的設定選項。一旦 Plugin 安裝完成，
其 manifest 會勝出，且該提供者的提供者索引項目會被忽略。

舊版頂層能力鍵已棄用。使用 `openclaw doctor --fix` 將
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；一般
manifest 載入不再將這些頂層欄位視為能力擁有權。

## Manifest 與 package.json

這兩個檔案用途不同：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選項中繼資料，以及必須在 Plugin 程式碼執行前存在的 UI 提示                                                   |
| `package.json`         | npm 中繼資料、相依項安裝，以及用於進入點、安裝門檻、設定或目錄中繼資料的 `openclaw` 區塊                                       |

如果你不確定某項中繼資料應放在哪裡，請使用此規則：

- 如果 OpenClaw 必須在載入 Plugin 程式碼前知道它，請放入 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放入 `package.json`

### 影響探索的 package.json 欄位

某些執行階段前的 Plugin 中繼資料刻意放在 `package.json` 的 `openclaw`
區塊下，而不是 `openclaw.plugin.json`。
`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw Plugin 契約；
原生 Plugin 必須使用 `openclaw.plugin.json`，以及下方支援的
`package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 含義                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生 Plugin 進入點。必須保持在 Plugin 套件目錄內。                                                                                                                              |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的已建置 JavaScript 執行階段進入點。必須保持在 Plugin 套件目錄內。                                                                                                    |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定進入點，用於上線導引、延後的通道啟動，以及唯讀通道狀態/SecretRef 探索。必須保持在 Plugin 套件目錄內。                                                                  |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的已建置 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須保持在 Plugin 套件目錄內。                                                                         |
| `openclaw.channel`                                                                         | 低成本的通道目錄中繼資料，例如標籤、文件路徑、別名，以及選項文案。                                                                                                                  |
| `openclaw.channel.commands`                                                                | 靜態原生命令與原生技能自動預設中繼資料，供設定、稽核和命令清單介面在通道執行階段載入前使用。                                                                                       |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已存在僅環境變數的設定？」                                                                             |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 給內建與外部發布 Plugin 的安裝/更新提示。                                                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | 當有多個安裝來源可用時偏好的安裝路徑。                                                                                                                                              |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝和更新流程會據此驗證擷取到的成品。                                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 當設定無效時，允許狹窄的內建 Plugin 重新安裝復原路徑。                                                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 讓僅設定的通道介面能在啟動期間於完整通道 Plugin 之前載入。                                                                                                                          |

資訊清單中繼資料會決定在執行階段載入前，哪些提供者/通道/設定選項會出現在
上線導引中。`package.json#openclaw.install` 會告訴
上線導引，當使用者選擇其中一個選項時，如何擷取或啟用該 Plugin。
不要把安裝提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在安裝與資訊清單
登錄載入期間，針對非內建 Plugin 來源強制執行。無效值會被拒絕；
較新但有效的值會讓較舊主機略過外部 Plugin。內建原始碼
Plugin 會被假設為與主機 checkout 同版本。

官方隨選安裝中繼資料在 Plugin 發布於 ClawHub 時應使用 `clawhubSpec`；
上線導引會將其視為偏好的遠端來源，並在安裝後記錄 ClawHub 成品事實。
`npmSpec` 仍保留為尚未移至 ClawHub 的套件的相容性
後備。

精確的 npm 版本釘選已存在於 `npmSpec`，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄
項目應將精確規格與 `expectedIntegrity` 配對，讓更新流程在
擷取到的 npm 成品不再符合釘選版本時以關閉方式失敗。
互動式上線導引為了相容性，仍會提供受信任登錄的 npm 規格，包括裸
套件名稱和 dist-tags。目錄診斷可以區分精確、浮動、已釘選完整性、
缺少完整性、套件名稱
不符，以及無效預設選項來源。當
`expectedIntegrity` 存在但沒有可供其釘選的有效 npm 來源時，也會發出警告。
當 `expectedIntegrity` 存在時，
安裝/更新流程會強制執行；省略時，登錄解析會
在沒有完整性釘選的情況下被記錄。

當狀態、通道清單或 SecretRef 掃描需要在不載入完整
執行階段的情況下識別已設定帳戶時，通道 Plugin 應提供 `openclaw.setupEntry`。
設定進入點應公開通道中繼資料，以及設定安全的設定、
狀態和秘密介面卡；請將網路用戶端、Gateway 監聽器和
傳輸執行階段保留在主要擴充功能進入點中。

執行階段進入點欄位不會覆寫原始碼
進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓
跳出邊界的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 是刻意狹窄的。它不會
讓任意損壞的設定變得可安裝。目前它只允許安裝
流程從特定的陳舊內建 Plugin 升級失敗中復原，例如
缺少內建 Plugin 路徑，或同一個
內建 Plugin 的陳舊 `channels.<id>` 項目。不相關的設定錯誤仍會阻止安裝，並將操作員
導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是小型檢查器
模組的套件中繼資料：

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

當設定、doctor、狀態或唯讀存在性流程需要在完整通道 Plugin 載入前進行低成本
是/否驗證探測時使用它。持久化驗證狀態
不是已設定通道狀態：不要使用此中繼資料來自動啟用 Plugin、
修復執行階段依賴，或決定是否應載入通道執行階段。
目標匯出應是只讀取持久化狀態的小型函式；不要
透過完整通道執行階段 barrel 來路由它。

`openclaw.channel.configuredState` 對低成本的僅環境變數
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

當通道可以從環境變數或其他小型
非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真實
通道執行階段，請將該邏輯保留在 Plugin `config.hasConfiguredState`
hook 中。

## 探索優先順序（重複 Plugin ID）

OpenClaw 會從多個根目錄探索 Plugin（內建、全域安裝、工作區、明確設定選取的路徑）。如果兩個探索結果共用相同的 `id`，只會保留**最高優先順序**的資訊清單；較低優先順序的重複項會被丟棄，而不是並列載入。

優先順序，由高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **內建** — 隨 OpenClaw 發佈的 Plugin
3. **全域安裝** — 安裝到全域 OpenClaw Plugin 根目錄的 Plugin
4. **工作區** — 相對於目前工作區探索到的 Plugin

影響：

- 位於工作區中的內建 Plugin 分叉或陳舊副本不會遮蔽內建建置。
- 若要真正用本機 Plugin 覆寫內建 Plugin，請透過 `plugins.entries.<id>` 釘選它，讓它以優先順序勝出，而不是依賴工作區探索。
- 重複項丟棄會被記錄，因此 Doctor 和啟動診斷可以指出被丟棄的副本。
- 設定選取的重複覆寫在診斷中會表述為明確覆寫，但仍會警告，讓陳舊分叉和意外遮蔽保持可見。

## JSON Schema 需求

- **每個 Plugin 都必須附帶 JSON Schema**，即使它不接受任何設定。
- 空 schema 可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段。
- 擴充或分叉具有新設定鍵的內建 Plugin 時，請同時更新該 Plugin 的 `openclaw.plugin.json` `configSchema`。內建 Plugin schema 是嚴格的，因此若在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，但未將 `myNewKey` 加入 `configSchema.properties`，會在 Plugin 執行階段載入前被拒絕。

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

- 未知的 `channels.*` 鍵是**錯誤**，除非該通道 ID 由
  Plugin 資訊清單宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必須參照**可探索**的 Plugin ID。未知 ID 是**錯誤**。
- 如果 Plugin 已安裝，但資訊清單或 schema 損壞或缺失，
  驗證會失敗，Doctor 會回報 Plugin 錯誤。
- 如果 Plugin 設定存在但該 Plugin 已**停用**，設定會保留，且
  **警告**會在 Doctor + 記錄中顯示。

請參閱[設定參考](/zh-TW/gateway/configuration)以了解完整的 `plugins.*` schema。

## 備註

- Manifest 是**原生 OpenClaw Plugin 的必要項目**，包括從本機檔案系統載入。Runtime 仍會另外載入 Plugin 模組；Manifest 只用於探索與驗證。
- 原生 Manifest 會以 JSON5 解析，因此只要最終值仍是物件，就接受註解、尾隨逗號和未加引號的鍵。
- Manifest loader 只會讀取已文件化的 Manifest 欄位。請避免使用自訂頂層鍵。
- 當 Plugin 不需要 `channels`、`providers`、`cliBackends` 和 `skills` 時，這些欄位都可以省略。
- `providerCatalogEntry` 必須保持輕量，不應匯入大量 Runtime 程式碼；請將它用於靜態 Provider 目錄中繼資料或狹窄的探索描述元，而不是請求期間執行。`providerDiscoveryEntry` 是舊版拼法，且仍適用於現有 Plugin。
- 專屬 Plugin 種類會透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`，`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此 Manifest 中宣告專屬 Plugin 種類。Runtime 入口的 `OpenClawPluginDefinition.kind` 已棄用，僅保留作為舊版 Plugin 的相容性 fallback。
- Env var 中繼資料（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告性。Status、稽核、Cron 傳遞驗證，以及其他唯讀介面，在將 env var 視為已設定之前，仍會套用 Plugin 信任與有效啟用政策。
- 如需需要 Provider 程式碼的 Runtime wizard 中繼資料，請參閱 [Provider Runtime hook](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的 Plugin 依賴原生模組，請文件化建置步驟與任何套件管理器 allowlist 需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="建置 Plugin" href="/zh-TW/plugins/building-plugins" icon="rocket">
    Plugin 入門。
  </Card>
  <Card title="Plugin 架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概觀" href="/zh-TW/plugins/sdk-overview" icon="book">
    Plugin SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
