---
read_when:
    - 你正在建置 OpenClaw Plugin
    - 你需要發布 Plugin 設定結構描述，或偵錯 Plugin 驗證錯誤
summary: Plugin 資訊清單 + JSON 結構描述要求（嚴格設定驗證）
title: Plugin 資訊清單
x-i18n:
    generated_at: "2026-05-02T20:52:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

此頁僅適用於 **原生 OpenClaw Plugin manifest**。

相容的 bundle 版面配置請參閱 [Plugin bundle](/zh-TW/plugins/bundles)。

相容的 bundle 格式使用不同的 manifest 檔案：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不含 manifest 的預設 Claude 元件
  版面配置
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些 bundle 版面配置，但它們不會依照此處說明的
`openclaw.plugin.json` 結構描述進行驗證。

對於相容 bundle，OpenClaw 目前會在版面配置符合 OpenClaw runtime 預期時，讀取 bundle 中繼資料以及宣告的
skill 根目錄、Claude command 根目錄、Claude bundle `settings.json` 預設值、
Claude bundle LSP 預設值，以及支援的 hook packs。

每個原生 OpenClaw Plugin **都必須**在
**Plugin 根目錄**中提供 `openclaw.plugin.json` 檔案。OpenClaw 會使用此 manifest 來驗證設定，
且**不執行 Plugin 程式碼**。缺少或無效的 manifest 會被視為
Plugin 錯誤，並阻止設定驗證。

請參閱完整的 Plugin 系統指南：[Plugins](/zh-TW/tools/plugin)。
原生 capability model 與目前外部相容性指南請參閱：
[Capability model](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的
Plugin 程式碼之前**讀取的中繼資料。以下所有內容都必須足夠輕量，能在不啟動
Plugin runtime 的情況下檢查。

**用途：**

- Plugin 身分、設定驗證，以及設定 UI 提示
- auth、onboarding 與設定中繼資料（alias、auto-enable、provider env vars、auth choices）
- control-plane surfaces 的 activation hints
- model-family ownership 簡寫
- 靜態 capability-ownership snapshots（`contracts`）
- 共用 `openclaw qa` host 可檢查的 QA runner 中繼資料
- 合併到 catalog 與 validation surfaces 的 channel-specific config 中繼資料

**請勿用於：**註冊 runtime 行為、宣告程式碼 entrypoints，
或 npm install 中繼資料。那些應放在你的 Plugin 程式碼和 `package.json` 中。

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

| 欄位                                | 必填 | 類型                             | 意義                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是      | `string`                         | 標準 Plugin ID。這是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                 |
| `configSchema`                       | 是      | `object`                         | 此 Plugin 設定的內嵌 JSON Schema。                                                                                                                                                                                        |
| `enabledByDefault`                   | 否       | `true`                           | 將內建 Plugin 標記為預設啟用。省略它，或設定任何非 `true` 的值，即可讓該 Plugin 預設停用。                                                                                                        |
| `legacyPluginIds`                    | 否       | `string[]`                       | 會正規化為此標準 Plugin ID 的舊版 ID。                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 當驗證、設定或模型參照提及時，應自動啟用此 Plugin 的供應商 ID。                                                                                                                                     |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 宣告由 `plugins.slots.*` 使用的互斥 Plugin 種類。                                                                                                                                                                        |
| `channels`                           | 否       | `string[]`                       | 此 Plugin 擁有的通道 ID。用於探索與設定驗證。                                                                                                                                                         |
| `providers`                          | 否       | `string[]`                       | 此 Plugin 擁有的供應商 ID。                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | 否       | `string`                         | 輕量級供應商探索模組路徑，相對於 Plugin 根目錄，用於可在不啟用完整 Plugin 執行階段的情況下載入的 manifest 範圍供應商目錄中繼資料。                                               |
| `modelSupport`                       | 否       | `object`                         | manifest 擁有的簡寫模型系列中繼資料，用於在執行階段前自動載入 Plugin。                                                                                                                                         |
| `modelCatalog`                       | 否       | `object`                         | 此 Plugin 擁有的供應商宣告式模型目錄中繼資料。這是未來唯讀清單、入門導引、模型選擇器、別名與抑制功能的控制平面合約，不需要載入 Plugin 執行階段。         |
| `modelPricing`                       | 否       | `object`                         | 供應商擁有的外部價格查詢政策。用它讓本機或自行託管的供應商退出遠端價格目錄，或將供應商參照對應到 OpenRouter/LiteLLM 目錄 ID，而不在核心中硬編碼供應商 ID。             |
| `modelIdNormalization`               | 否       | `object`                         | 供應商擁有的模型 ID 別名或前綴清理，必須在供應商執行階段載入前執行。                                                                                                                                           |
| `providerEndpoints`                  | 否       | `object[]`                       | manifest 擁有的端點主機或 baseUrl 中繼資料，用於核心必須在供應商執行階段載入前分類的供應商路由。                                                                                                            |
| `providerRequest`                    | 否       | `object`                         | 泛用請求政策在供應商執行階段載入前使用的低成本供應商系列與請求相容性中繼資料。                                                                                                              |
| `cliBackends`                        | 否       | `string[]`                       | 此 Plugin 擁有的 CLI 推論後端 ID。用於從明確設定參照在啟動時自動啟用。                                                                                                                         |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | 供應商或 CLI 後端參照，其 Plugin 擁有的合成驗證鉤子應在冷模型探索期間、執行階段載入前進行探測。                                                                                              |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | 內建 Plugin 擁有的占位 API 金鑰值，代表非機密的本機、OAuth 或環境憑證狀態。                                                                                                                |
| `commandAliases`                     | 否       | `object[]`                       | 此 Plugin 擁有的命令名稱，應在執行階段載入前產生具備 Plugin 感知能力的設定與 CLI 診斷。                                                                                                                |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | 已淘汰的供應商驗證或狀態查詢相容性環境中繼資料。新 Plugin 請優先使用 `setup.providers[].envVars`；OpenClaw 仍會在淘汰期間讀取此項。                                                 |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 應重複使用另一個供應商 ID 進行驗證查詢的供應商 ID，例如共用基礎供應商 API 金鑰與驗證設定檔的編碼供應商。                                                                          |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 可在不載入 Plugin 程式碼的情況下檢查的低成本通道環境中繼資料。用於泛用啟動或設定輔助工具應看見的環境驅動通道設定或驗證介面。                                            |
| `providerAuthChoices`                | 否       | `object[]`                       | 用於入門導引選擇器、偏好供應商解析與簡單 CLI 旗標接線的低成本驗證選項中繼資料。                                                                                                                       |
| `activation`                         | 否       | `object`                         | 用於啟動、供應商、命令、通道、路由與能力觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由 Plugin 執行階段擁有。                                                       |
| `setup`                              | 否       | `object`                         | 探索與設定介面可在不載入 Plugin 執行階段的情況下檢查的低成本設定或入門導引描述元。                                                                                                                    |
| `qaRunners`                          | 否       | `object[]`                       | 共享 `openclaw qa` 主機在 Plugin 執行階段載入前使用的低成本 QA 執行器描述元。                                                                                                                                      |
| `contracts`                          | 否       | `object`                         | 外部驗證鉤子、語音、即時轉錄、即時語音、媒體理解、影像生成、音樂生成、影片生成、網頁擷取、網頁搜尋與工具所有權的靜態能力所有權快照。 |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` 中宣告的供應商 ID 的低成本媒體理解預設值。                                                                                                                            |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`         | `contracts.imageGenerationProviders` 中宣告的供應商 ID 的低成本影像生成驗證中繼資料，包含供應商擁有的驗證別名與基礎 URL 防護。                                                                  |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`         | `contracts.videoGenerationProviders` 中宣告的供應商 ID 的低成本影片生成驗證中繼資料，包含供應商擁有的驗證別名與基礎 URL 防護。                                                                  |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`         | `contracts.musicGenerationProviders` 中宣告的供應商 ID 的低成本音樂生成驗證中繼資料，包含供應商擁有的驗證別名與基礎 URL 防護。                                                                  |
| `toolMetadata`                       | 否       | `Record<string, object>`         | `contracts.tools` 中宣告的 Plugin 擁有工具的低成本可用性中繼資料。當工具不應載入執行階段，除非存在設定、環境或驗證證據時使用。                                                           |
| `channelConfigs`                     | 否       | `Record<string, object>`         | manifest 擁有的通道設定中繼資料，會在執行階段載入前合併到探索與驗證介面。                                                                                                                          |
| `skills`                             | 否       | `string[]`                       | 要載入的 Skill 目錄，相對於 Plugin 根目錄。                                                                                                                                                                             |
| `name`                               | 否       | `string`                         | 人類可讀的 Plugin 名稱。                                                                                                                                                                                                         |
| `description`                        | 否       | `string`                         | 顯示於 Plugin 介面中的簡短摘要。                                                                                                                                                                                             |
| `version`                            | 否       | `string`                         | 資訊性的 Plugin 版本。                                                                                                                                                                                                       |
| `uiHints`                            | 否       | `Record<string, object>`         | 設定欄位的 UI 標籤、預留位置和敏感性提示。                                                                                                                                                                   |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述在相符的 `contracts.*GenerationProviders` 清單中宣告的提供者靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具無需匯入每個提供者 Plugin，就能判斷某個生成提供者是否可用。

這些欄位只應用於低成本、宣告式的事實。傳輸、請求轉換、權杖重新整理、認證驗證，以及實際的生成行為，都保留在 Plugin 執行階段中。

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
| `aliases`       | 否   | `string[]` | 其他提供者 ID，應計為該生成提供者的靜態驗證別名。                                                                          |
| `authProviders` | 否   | `string[]` | 其已設定的驗證設定檔應計為此生成提供者驗證的提供者 ID。                                                                    |
| `configSignals` | 否   | `object[]` | 用於本機或自行託管提供者的低成本、僅設定可用性訊號，這些提供者可在沒有驗證設定檔或環境變數的情況下設定。                  |
| `authSignals`   | 否   | `object[]` | 明確的驗證訊號。若存在，這些訊號會取代來自提供者 ID、`aliases` 和 `authProviders` 的預設訊號集。                           |

每個 `configSignals` 項目支援：

| 欄位          | 必填 | 類型       | 含義                                                                                                                                                                   |
| ------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | 是   | `string`   | 要檢查的 Plugin 所擁有設定物件的點路徑，例如 `plugins.entries.example.config`。                                                                                       |
| `overlayPath` | 否   | `string`   | 根設定內的點路徑，其物件應在評估訊號前覆蓋根物件。將此用於能力專屬設定，例如 `image`、`video` 或 `music`。                                                            |
| `required`    | 否   | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不可為空；物件和陣列不得為空。                                                                                                |
| `requiredAny` | 否   | `string[]` | 有效設定內的點路徑，其中至少一個必須具有已設定值。                                                                                                                     |
| `mode`        | 否   | `object`   | 有效設定內的可選字串模式防護。當僅設定可用性只適用於某一種模式時使用。                                                                                                |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                                 |
| ------------ | ---- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                                  |
| `default`    | 否   | `string`   | 當設定省略該路徑時要使用的模式值。                                                   |
| `allowed`    | 否   | `string[]` | 若存在，只有當有效模式是這些值之一時，訊號才會通過。                                 |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式是這些值之一時，訊號會失敗。                                       |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                                          |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                                       |
| `providerBaseUrl` | 否   | `object` | 可選防護，讓訊號只有在所參照的已設定提供者使用允許的基底 URL 時才計入。當驗證別名只對特定 API 有效時使用。                                                    |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                          |
| ----------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的提供者設定 ID。                                                                                                        |
| `defaultBaseUrl`  | 否   | `string`   | 當提供者設定省略 `baseUrl` 時假設的基底 URL。                                                                                                 |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設基底 URL 不符合這些正規化值之一時，該訊號會被忽略。                                                   |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 形狀，並以工具名稱為鍵。`contracts.tools` 宣告所有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 能避免僅為了讓工具工廠回傳 `null` 而匯入 Plugin 執行階段。

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

如果工具沒有 `toolMetadata`，OpenClaw 會保留現有行為，並在工具合約符合政策時載入擁有該工具的 Plugin。對於其工廠依賴驗證/設定的熱路徑工具，Plugin 作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個入門設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此內容。提供者設定清單會使用這些資訊清單選項、從描述子衍生的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                            | 含義                                                                                                    |
| --------------------- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此選項所屬的提供者 ID。                                                                                 |
| `method`              | 是   | `string`                                        | 要分派至的驗證方法 ID。                                                                                 |
| `choiceId`            | 是   | `string`                                        | 入門設定與 CLI 流程使用的穩定驗證選項 ID。                                                              |
| `choiceLabel`         | 否   | `string`                                        | 面向使用者的標籤。若省略，OpenClaw 會回退使用 `choiceId`。                                              |
| `choiceHint`          | 否   | `string`                                        | 選擇器的簡短輔助文字。                                                                                  |
| `assistantPriority`   | 否   | `number`                                        | 較低的值會在助理驅動的互動式選擇器中較早排序。                                                          |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 從助理選擇器隱藏該選項，同時仍允許手動 CLI 選取。                                                       |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 應將使用者重新導向至此替代選項的舊版選項 ID。                                                           |
| `groupId`             | 否   | `string`                                        | 用於分組相關選項的可選群組 ID。                                                                         |
| `groupLabel`          | 否   | `string`                                        | 該群組面向使用者的標籤。                                                                                |
| `groupHint`           | 否   | `string`                                        | 群組的簡短輔助文字。                                                                                    |
| `optionKey`           | 否   | `string`                                        | 用於簡單單旗標驗證流程的內部選項鍵。                                                                    |
| `cliFlag`             | 否   | `string`                                        | CLI 旗標名稱，例如 `--openrouter-api-key`。                                                             |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 選項形狀，例如 `--openrouter-api-key <key>`。                                                  |
| `cliDescription`      | 否   | `string`                                        | CLI 說明中使用的描述。                                                                                  |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此選項應出現在哪些入門設定介面中。若省略，預設為 `["text-inference"]`。                                 |

## commandAliases 參考

使用 `commandAliases`，當 Plugin 擁有使用者可能誤放進 `plugins.allow`，或嘗試以根 CLI 命令執行的 runtime 命令名稱時。OpenClaw 會使用這項 metadata 進行診斷，而不匯入 Plugin runtime code。

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

| 欄位         | 必填 | 型別              | 含義                                                                 |
| ------------ | ---- | ----------------- | -------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此 Plugin 的命令名稱。                                           |
| `kind`       | 否   | `"runtime-slash"` | 將別名標記為聊天斜線命令，而非根 CLI 命令。                         |
| `cliCommand` | 否   | `string`          | 若存在，建議用於 CLI 操作的相關根 CLI 命令。                        |

## activation 參考

當 Plugin 能低成本宣告哪些 control-plane 事件應將它納入 activation/load plan 時，請使用 `activation`。

此區塊是 planner metadata，不是 lifecycle API。它不會註冊 runtime 行為、不會取代 `register(...)`，也不保證 Plugin code 已經執行。activation planner 會使用這些欄位，在回退到既有 manifest ownership metadata（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，縮小候選 Plugins 的範圍。

優先使用已能描述 ownership 的最精確 metadata。當 `providers`、`channels`、`commandAliases`、setup descriptors 或 `contracts` 能表達關係時，請使用那些欄位。將 `activation` 用於無法以那些 ownership 欄位表示的額外 planner 提示。針對 CLI runtime aliases（例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`），請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 只用於尚未有 ownership 欄位的 embedded agent harness ids。

此區塊僅為 metadata。它不會註冊 runtime 行為，也不會取代 `register(...)`、`setupEntry` 或其他 runtime/Plugin entrypoints。目前的 consumers 會先將它作為 narrowing hint，再進行更廣泛的 Plugin loading，因此缺少非啟動 activation metadata 通常只會影響效能；只要 manifest ownership fallbacks 仍存在，就不應改變正確性。

每個 Plugin 都應有意識地設定 `activation.onStartup`。只有當 Plugin 必須在 Gateway 啟動期間執行時，才將它設為 `true`。當 Plugin 在啟動時為 inert，且應只從更精確的 triggers 載入時，請將它設為 `false`。省略 `onStartup` 不再會隱式 startup-load Plugin；請針對 startup、channel、config、agent-harness、memory 或其他更精確的 activation triggers 使用明確的 activation metadata。

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

| 欄位               | 必填 | 型別                                                 | 含義                                                                                                                                                                                     |
| ------------------ | ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的 Gateway startup activation。每個 Plugin 都應設定此欄位。`true` 會在啟動期間匯入 Plugin；`false` 會保持 startup-lazy，除非另一個相符的 trigger 需要載入。                         |
| `onProviders`      | 否   | `string[]`                                           | 應將此 Plugin 納入 activation/load plans 的 provider ids。                                                                                                                              |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此 Plugin 納入 activation/load plans 的 embedded agent harness runtime ids。CLI backend aliases 請使用頂層 `cliBackends`。                                                          |
| `onCommands`       | 否   | `string[]`                                           | 應將此 Plugin 納入 activation/load plans 的 command ids。                                                                                                                               |
| `onChannels`       | 否   | `string[]`                                           | 應將此 Plugin 納入 activation/load plans 的 channel ids。                                                                                                                               |
| `onRoutes`         | 否   | `string[]`                                           | 應將此 Plugin 納入 activation/load plans 的 route kinds。                                                                                                                               |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未被明確停用時，應將此 Plugin 納入 startup/load plans 的 root-relative config paths。                                                                                       |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane activation planning 使用的廣泛 capability hints。可行時請優先使用更精確的欄位。                                                                                          |

目前的 live consumers：

- Gateway startup planning 使用 `activation.onStartup` 進行明確的 startup import
- command-triggered CLI planning 會回退到舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- agent-runtime startup planning 針對 embedded harnesses 使用 `activation.onAgentHarnesses`，並針對 CLI runtime aliases 使用頂層 `cliBackends[]`
- channel-triggered setup/channel planning 在缺少明確 channel activation metadata 時，會回退到舊版 `channels[]` ownership
- startup Plugin planning 針對非 channel 根 config surfaces 使用 `activation.onConfigPaths`，例如 bundled browser Plugin 的 `browser` 區塊
- provider-triggered setup/runtime planning 在缺少明確 provider activation metadata 時，會回退到舊版 `providers[]` 與頂層 `cliBackends[]` ownership

Planner diagnostics 可以區分明確 activation hints 與 manifest ownership fallback。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示 planner 改用 `commandAliases` ownership。這些 reason labels 用於 host diagnostics 與 tests；Plugin authors 應持續宣告最能描述 ownership 的 metadata。

## qaRunners 參考

當 Plugin 在共享的 `openclaw qa` 根之下貢獻一個或多個 transport runners 時，請使用 `qaRunners`。讓此 metadata 保持低成本且靜態；Plugin runtime 仍透過輕量 `runtime-api.ts` surface 匯出的 `qaRunnerCliRegistrations` 擁有實際的 CLI 註冊。

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

| 欄位          | 必填 | 型別     | 含義                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是   | `string` | 掛載在 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 當共享 host 需要 stub command 時使用的 fallback help text。        |

## setup 參考

當 setup 與 onboarding surfaces 在 runtime 載入前需要低成本、Plugin-owned metadata 時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並持續描述 CLI inference backends。`setup.cliBackends` 是用於 control-plane/setup flows、應保持 metadata-only 的 setup-specific descriptor surface。

存在時，`setup.providers` 與 `setup.cliBackends` 是 setup discovery 的首選 descriptor-first lookup surface。如果 descriptor 只縮小候選 Plugin 範圍，而 setup 仍需要更豐富的 setup-time runtime hooks，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為 fallback execution path。

OpenClaw 也會將 `setup.providers[].envVars` 納入通用 provider auth 與 env-var lookups。`providerAuthEnvVars` 在 deprecation window 期間仍透過 compatibility adapter 受到支援，但仍使用它的非 bundled Plugins 會收到 manifest diagnostic。新的 Plugins 應將 setup/status env metadata 放在 `setup.providers[].envVars`。

當沒有可用的 setup entry，或 `setup.requiresRuntime: false` 宣告不需要 setup runtime 時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的 setup choices。明確的 `providerAuthChoices` entries 仍優先用於自訂 labels、CLI flags、onboarding scope 與 assistant metadata。

只有當這些 descriptors 足以支援 setup surface 時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為 descriptor-only contract，且不會為 setup lookup 執行 `setup-api` 或 `openclaw.setupEntry`。如果 descriptor-only Plugin 仍隨附其中一個 setup runtime entries，OpenClaw 會回報 additive diagnostic，並繼續忽略它。省略 `requiresRuntime` 會保留舊版 fallback 行為，因此已新增 descriptors 但未加上此 flag 的既有 Plugins 不會中斷。

因為 setup lookup 可以執行 Plugin-owned `setup-api` code，normalized `setup.providers[].id` 與 `setup.cliBackends[]` values 必須在 discovered Plugins 之間保持唯一。Ambiguous ownership 會 fail closed，而不是從 discovery order 中挑選 winner。

當 setup runtime 確實執行時，如果 `setup-api` 註冊了 manifest descriptors 未宣告的 provider 或 CLI backend，或 descriptor 沒有相符的 runtime registration，setup registry diagnostics 會回報 descriptor drift。這些 diagnostics 是 additive，且不會拒絕舊版 Plugins。

### setup.providers 參考

| 欄位           | 必填 | 型別       | 含義                                                                                              |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | 在 setup 或 onboarding 期間公開的 provider id。請讓 normalized ids 在全域保持唯一。              |
| `authMethods`  | 否   | `string[]` | 此 provider 在不載入完整 runtime 的情況下支援的 setup/auth method ids。                           |
| `envVars`      | 否   | `string[]` | 通用 setup/status surfaces 可在 Plugin runtime 載入前檢查的 env vars。                            |
| `authEvidence` | 否   | `object[]` | 針對可透過非 secret markers 驗證的 providers，低成本的本機 auth evidence checks。                 |

`authEvidence` 用於由提供者擁有的本機憑證標記，這些標記可以在不載入執行階段程式碼的情況下驗證。這些檢查必須維持低成本且在本機執行：不得進行網路呼叫、不得讀取鑰匙圈或秘密管理器、不得執行 shell 命令，也不得探測提供者 API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 含義                                                                                                  |
| ------------------ | ---- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                        |
| `fileEnvVar`       | 否   | `string`   | 包含明確憑證檔案路徑的環境變數。                                                                     |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。               |
| `requiresAnyEnv`   | 否   | `string[]` | 至少一個列出的環境變數必須為非空，證據才有效。                                                       |
| `requiresAllEnv`   | 否   | `string[]` | 每個列出的環境變數都必須為非空，證據才有效。                                                         |
| `credentialMarker` | 是   | `string`   | 當證據存在時傳回的非秘密標記。                                                                       |
| `source`           | 否   | `string`   | 用於驗證／狀態輸出的面向使用者來源標籤。                                                             |

### 設定欄位

| 欄位               | 必填 | 類型       | 含義                                                                                        |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在設定和入門流程期間公開的提供者設定描述元。                                                |
| `cliBackends`      | 否   | `string[]` | 設定期間用於描述元優先設定查詢的後端 ID。請保持正規化 ID 在全域唯一。                       |
| `configMigrations` | 否   | `string[]` | 由此 Plugin 的設定介面擁有的設定遷移 ID。                                                   |
| `requiresRuntime`  | 否   | `boolean`  | 描述元查詢後，設定是否仍需要執行 `setup-api`。                                              |

## uiHints 參考

`uiHints` 是從設定欄位名稱到小型呈現提示的對應。

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

每個欄位提示都可以包含：

| 欄位          | 類型       | 含義                           |
| ------------- | ---------- | ------------------------------ |
| `label`       | `string`   | 面向使用者的欄位標籤。         |
| `help`        | `string`   | 簡短的輔助文字。               |
| `tags`        | `string[]` | 選用的 UI 標籤。               |
| `advanced`    | `boolean`  | 將欄位標記為進階。             |
| `sensitive`   | `boolean`  | 將欄位標記為秘密或敏感。       |
| `placeholder` | `string`   | 表單輸入的預留文字。           |

## contracts 參考

僅將 `contracts` 用於靜態能力擁有權中繼資料，讓 OpenClaw 可以在不匯入 Plugin 執行階段的情況下讀取。

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

| 欄位                             | 類型       | 含義                                                                 |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 延伸工廠 ID，目前為 `codex-app-server`。            |
| `agentToolResultMiddleware`      | `string[]` | 捆綁 Plugin 可為其註冊工具結果中介軟體的執行階段 ID。               |
| `externalAuthProviders`          | `string[]` | 此 Plugin 擁有其外部驗證設定檔 hook 的提供者 ID。                   |
| `speechProviders`                | `string[]` | 此 Plugin 擁有的語音提供者 ID。                                      |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 擁有的即時轉錄提供者 ID。                                  |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 擁有的即時語音提供者 ID。                                  |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 擁有的記憶體嵌入提供者 ID。                                |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 擁有的媒體理解提供者 ID。                                  |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 擁有的影像產生提供者 ID。                                  |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 擁有的影片產生提供者 ID。                                  |
| `webFetchProviders`              | `string[]` | 此 Plugin 擁有的網頁擷取提供者 ID。                                  |
| `webSearchProviders`             | `string[]` | 此 Plugin 擁有的網頁搜尋提供者 ID。                                  |
| `migrationProviders`             | `string[]` | 此 Plugin 為 `openclaw migrate` 擁有的匯入提供者 ID。                |
| `tools`                          | `string[]` | 此 Plugin 擁有的代理工具名稱。                                       |

`contracts.embeddedExtensionFactories` 保留給捆綁的 Codex 僅限 app-server 的延伸工廠。捆綁的工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。外部 Plugin 無法註冊工具結果中介軟體，因為該接縫可以在模型看到高信任度工具輸出之前重寫它。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。工具探索會使用此清單，只載入可擁有所請求工具的 Plugin 執行階段。

實作 `resolveExternalAuthProfiles` 的提供者 Plugin 應宣告 `contracts.externalAuthProviders`。沒有宣告的 Plugin 仍會透過已棄用的相容性後援執行，但該後援較慢，並會在遷移窗口結束後移除。

捆綁的記憶體嵌入提供者應為其公開的每個配接器 ID 宣告 `contracts.memoryEmbeddingProviders`，包括 `local` 等內建配接器。獨立 CLI 路徑會使用此資訊清單合約，在完整 Gateway 執行階段註冊提供者之前，只載入擁有者 Plugin。

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證後援優先順序，或泛用核心輔助程式在執行階段載入前所需的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

每個提供者項目都可以包含：

| 欄位                   | 類型                                | 含義                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供者公開的媒體能力。                                                     |
| `defaultModels`        | `Record<string, string>`            | 當設定未指定模型時使用的能力到模型預設值。                                   |
| `autoPriority`         | `Record<string, number>`            | 數字越低，在基於憑證的自動提供者後援排序中越靠前。                           |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供者支援的原生文件輸入。                                                   |

## channelConfigs 參考

當通道 Plugin 需要在執行階段載入前取得低成本設定中繼資料時，請使用 `channelConfigs`。唯讀通道設定／狀態探索可在沒有設定項目可用時，或當 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，直接針對已設定的外部通道使用此中繼資料。

`channelConfigs` 是 Plugin 資訊清單中繼資料，不是新的頂層使用者設定區段。使用者仍在 `channels.<channel-id>` 下設定通道執行個體。OpenClaw 會讀取資訊清單中繼資料，以便在 Plugin 執行階段程式碼執行之前，判斷哪個 Plugin 擁有該已設定通道。

對於通道 Plugin，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非捆綁 Plugin 也應宣告相符的 `channelConfigs` 項目。若沒有這些項目，OpenClaw 仍可載入 Plugin，但冷路徑設定結構描述、設定和 Control UI 介面無法在 Plugin 執行階段執行前得知通道擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以為通道執行階段載入前執行的命令設定檢查宣告靜態 `auto` 預設值。捆綁通道也可以透過 `package.json#openclaw.channel.commands` 發布相同預設值，並與其他由套件擁有的通道目錄中繼資料並列。

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

每個通道項目都可以包含：

| 欄位          | 類型                     | 含義                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個宣告的 channel 設定項目都必填。                       |
| `uiHints`     | `Record<string, object>` | 該 channel 設定區段的選用 UI 標籤、預留位置、敏感提示。                                  |
| `label`       | `string`                 | 執行階段 metadata 尚未就緒時，合併到選擇器與檢查介面的 channel 標籤。                    |
| `description` | `string`                 | 用於檢查與 catalog 介面的簡短 channel 描述。                                              |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 skill 自動預設值。                            |
| `preferOver`  | `string[]`               | 此 channel 在選取介面中應優先於其上的舊版或較低優先順序 Plugin ID。                      |

### 取代另一個 channel Plugin

當你的 Plugin 是某個 channel ID 的偏好擁有者，而另一個 Plugin 也能提供該 channel ID 時，請使用 `preferOver`。常見情況包括重新命名的 Plugin ID、取代內建 Plugin 的獨立 Plugin，或為了設定相容性而保留相同 channel ID 的維護中 fork。

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

設定 `channels.chat` 時，OpenClaw 會同時考量 channel ID 與偏好的 Plugin ID。如果較低優先順序的 Plugin 只是因為內建或預設啟用而被選取，OpenClaw 會在有效的執行階段設定中停用它，讓單一 Plugin 擁有該 channel 及其工具。明確的使用者選取仍會優先：如果使用者明確啟用兩個 Plugin，OpenClaw 會保留該選擇，並回報重複 channel/工具診斷，而不是靜默變更要求的 Plugin 集合。

請將 `preferOver` 限定於確實能提供相同 channel 的 Plugin ID。它不是一般用途的優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在 Plugin 執行階段載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷你的提供者 Plugin 時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用此優先順序：

- 明確的 `provider/model` 參照會使用所屬 `providers` manifest metadata
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非內建 Plugin 和一個內建 Plugin 都相符，非內建 Plugin 會勝出
- 其餘歧義會被忽略，直到使用者或設定指定提供者

欄位：

| 欄位            | 類型       | 含義                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 以 `startsWith` 對簡寫模型 ID 進行比對的前綴。                            |
| `modelPatterns` | `string[]` | 移除 profile suffix 後，用於比對簡寫模型 ID 的正規表示式來源。            |

## modelCatalog 參考

當 OpenClaw 應在載入 Plugin 執行階段前知道提供者模型 metadata 時，請使用 `modelCatalog`。這是 manifest 擁有的來源，用於固定 catalog 列、提供者別名、抑制規則與探索模式。執行階段重新整理仍屬於提供者執行階段程式碼，但 manifest 會告訴核心何時需要執行階段。

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

| 欄位           | 類型                                                     | 含義                                                                                                  |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此 Plugin 擁有的提供者 ID 的 catalog 列。鍵也應出現在頂層 `providers` 中。                           |
| `aliases`      | `Record<string, object>`                                 | 應解析為所擁有提供者的提供者別名，用於 catalog 或抑制規劃。                                          |
| `suppressions` | `object[]`                                               | 此 Plugin 因提供者特定原因而抑制的其他來源模型列。                                                   |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者 catalog 是否可從 manifest metadata 讀取、重新整理到快取，或需要執行階段。                     |

`aliases` 會參與模型 catalog 規劃的提供者擁有權查找。別名目標必須是同一 Plugin 擁有的頂層提供者。當以提供者篩選的列表使用別名時，OpenClaw 可以讀取所屬 manifest，並在不載入提供者執行階段的情況下套用別名 API/base URL 覆寫。別名不會展開未篩選的 catalog 清單；廣泛清單只會輸出所屬標準提供者列。

`suppressions` 會取代舊的提供者執行階段 `suppressBuiltInModel` hook。只有在提供者由該 Plugin 擁有，或宣告為以所擁有提供者為目標的 `modelCatalog.aliases` 鍵時，抑制項目才會生效。模型解析期間不再呼叫執行階段抑制 hook。

提供者欄位：

| 欄位      | 類型                     | 含義                                                        |
| --------- | ------------------------ | ----------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供者 catalog 中模型的選用預設 base URL。               |
| `api`     | `ModelApi`               | 此提供者 catalog 中模型的選用預設 API adapter。            |
| `headers` | `Record<string, string>` | 套用至此提供者 catalog 的選用靜態 header。                 |
| `models`  | `object[]`               | 必填模型列。沒有 `id` 的列會被忽略。                       |

模型欄位：

| 欄位            | 類型                                                           | 含義                                                                      |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供者本機模型 ID，不含 `provider/` 前綴。                                |
| `name`          | `string`                                                       | 選用顯示名稱。                                                            |
| `api`           | `ModelApi`                                                     | 選用的逐模型 API 覆寫。                                                   |
| `baseUrl`       | `string`                                                       | 選用的逐模型 base URL 覆寫。                                              |
| `headers`       | `Record<string, string>`                                       | 選用的逐模型靜態 header。                                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                                          |
| `reasoning`     | `boolean`                                                      | 模型是否公開推理行為。                                                    |
| `contextWindow` | `number`                                                       | 原生提供者 context window。                                               |
| `contextTokens` | `number`                                                       | 與 `contextWindow` 不同時，選用的有效執行階段 context 上限。              |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出 token 數。                                               |
| `cost`          | `object`                                                       | 選用的每百萬 token 美元定價，包含選用的 `tieredPricing`。                 |
| `compat`        | `object`                                                       | 符合 OpenClaw 模型設定相容性的選用相容性旗標。                            |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 清單狀態。只有在該列完全不得出現時才抑制。                                |
| `statusReason`  | `string`                                                       | 與非可用狀態一併顯示的選用原因。                                          |
| `replaces`      | `string[]`                                                     | 此模型取代的較舊提供者本機模型 ID。                                       |
| `replacedBy`    | `string`                                                       | 已棄用列的替代提供者本機模型 ID。                                         |
| `tags`          | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                            |

抑制欄位：

| 欄位                       | 類型       | 含義                                                                                                 |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此 Plugin 擁有，或宣告為所擁有的別名。                               |
| `model`                    | `string`   | 要抑制的提供者本機模型 ID。                                                                          |
| `reason`                   | `string`   | 直接要求被抑制列時顯示的選用訊息。                                                                  |
| `when.baseUrlHosts`        | `string[]` | 套用抑制前所需的有效提供者 base URL host 選用清單。                                                  |
| `when.providerConfigApiIn` | `string[]` | 套用抑制前所需的精確 provider-config `api` 值選用清單。                                             |

不要將僅限執行階段的資料放入 `modelCatalog`。只有在 manifest 資料列完整到足以讓依提供者篩選的清單與選擇器介面略過 registry/執行階段探索時，才使用 `static`。當 manifest 資料列是有用的可列出種子或補充資料，但 refresh/cache 之後可以加入更多資料列時，請使用 `refreshable`；refreshable 資料列本身並非權威來源。當 OpenClaw 必須載入提供者執行階段才能知道清單時，請使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、由提供者擁有的模型 ID 清理，而且這必須在提供者執行階段載入前發生。這會把短模型名稱、提供者本機舊版 ID，以及 proxy 前綴規則等別名保留在所屬 Plugin manifest 中，而不是放在核心模型選擇表內。

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
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依照寫入內容原樣回傳。                               |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版提供者/模型重複情況。                                  |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                                         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 作為鍵。                   |

## providerEndpoints 參考

使用 `providerEndpoints` 進行端點分類，讓泛用請求政策能在提供者執行階段載入前知道。核心仍然擁有每個 `endpointClass` 的含義；Plugin manifest 擁有主機與基底 URL 中繼資料。

端點欄位：

| 欄位                           | 類型       | 含義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                  |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                                 |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機尾碼。使用 `.` 前綴表示僅符合網域尾碼。                                  |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) 基底 URL。                                                  |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的尾碼，用來公開 Google Vertex 區域前綴。                                       |

## providerRequest 參考

使用 `providerRequest` 提供低成本的請求相容性中繼資料，讓泛用請求政策不必載入提供者執行階段即可使用。將行為特定的 payload 重寫保留在提供者執行階段 hook 或共用提供者家族輔助工具中。

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

| 欄位                  | 類型         | 含義                                                                                     |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | 泛用請求相容性決策與診斷所使用的提供者家族標籤。                                        |
| `compatibilityFamily` | `"moonshot"` | 共用請求輔助工具的選用提供者家族相容性分組。                                            |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。                      |

## modelPricing 參考

當提供者需要在執行階段載入前控制控制平面的定價行為時，請使用 `modelPricing`。Gateway 定價快取會讀取此中繼資料，而不匯入提供者執行階段程式碼。

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

| 欄位         | 類型              | 含義                                                                                                      |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對不應擷取 OpenRouter 或 LiteLLM 定價的本機/自行託管提供者設為 `false`。                                  |
| `openRouter` | `false \| object` | OpenRouter 定價查找對應。`false` 會停用此提供者的 OpenRouter 查找。                                       |
| `liteLLM`    | `false \| object` | LiteLLM 定價查找對應。`false` 會停用此提供者的 LiteLLM 查找。                                            |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                                  |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 外部 catalog 提供者 ID，當它與 OpenClaw 提供者 ID 不同時使用，例如 `zai` 提供者對應的 `z-ai`。                       |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀提供者/模型參照，適用於 OpenRouter 等 proxy 提供者。                                    |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部 catalog 模型 ID 變體。`version-dots` 會嘗試像 `claude-opus-4.6` 這樣的點分隔版本 ID。                     |

### OpenClaw 提供者索引

OpenClaw 提供者索引是由 OpenClaw 擁有的提供者預覽中繼資料，適用於其 Plugin 可能尚未安裝的提供者。它不是 Plugin manifest 的一部分。Plugin manifest 仍然是已安裝 Plugin 的權威來源。提供者索引是內部 fallback 合約，未來可安裝提供者與安裝前模型選擇器介面，會在提供者 Plugin 未安裝時使用它。

Catalog 權威順序：

1. 使用者設定。
2. 已安裝 Plugin manifest `modelCatalog`。
3. 明確 refresh 產生的模型 catalog 快取。
4. OpenClaw 提供者索引預覽資料列。

提供者索引不得包含密鑰、啟用狀態、執行階段 hook，或即時帳戶特定模型資料。其預覽 catalog 使用與 Plugin manifest 相同的 `modelCatalog` 提供者資料列形狀，但應限於穩定的顯示中繼資料，除非 `api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位，是刻意與已安裝 Plugin manifest 保持一致。具有即時 `/models` 探索的提供者，應透過明確模型 catalog 快取路徑寫入 refresh 後的資料列，而不是讓一般清單列出或 onboarding 呼叫提供者 API。

提供者索引項目也可以攜帶可安裝 Plugin 中繼資料，適用於 Plugin 已移出核心或尚未安裝的提供者。此中繼資料對應 channel catalog 模式：套件名稱、npm 安裝規格、預期完整性，以及低成本驗證選項標籤，足以顯示可安裝的設定選項。Plugin 一旦安裝，其 manifest 即勝出，該提供者的提供者索引項目會被忽略。

舊版頂層功能鍵已棄用。使用 `openclaw doctor --fix` 將 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 底下；一般 manifest 載入不再將這些頂層欄位視為功能所有權。

## Manifest 與 package.json

這兩個檔案負責不同工作：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 必須在 Plugin 程式碼執行前存在的探索、設定驗證、驗證選項中繼資料，以及 UI 提示                                                   |
| `package.json`         | npm 中繼資料、相依項安裝，以及用於進入點、安裝 gating、設定或 catalog 中繼資料的 `openclaw` 區塊                                |

如果不確定某項中繼資料應放在哪裡，請使用這條規則：

- 如果 OpenClaw 必須在載入 Plugin 程式碼前知道它，請放在 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放在 `package.json`

### 影響探索的 package.json 欄位

某些執行階段前的 Plugin 中繼資料刻意放在 `package.json` 的 `openclaw` 區塊下，而不是 `openclaw.plugin.json`。
`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw Plugin 合約；原生 Plugin 必須使用 `openclaw.plugin.json` 加上以下支援的 `package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 意義                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 宣告原生 Plugin 進入點。必須留在 Plugin 套件目錄內。                                                                                                                                |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須留在 Plugin 套件目錄內。                                                                                                      |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定用進入點，用於初始設定、延後的通道啟動，以及唯讀通道狀態/SecretRef 探索。必須留在 Plugin 套件目錄內。                                                                  |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的建置後 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須留在 Plugin 套件目錄內。                                                                           |
| `openclaw.channel`                                                                         | 低成本通道目錄中繼資料，例如標籤、文件路徑、別名與選取文案。                                                                                                                       |
| `openclaw.channel.commands`                                                                | 在通道執行階段載入前，由設定、稽核與命令清單介面使用的靜態原生命令與原生 skill 自動預設中繼資料。                                                                                  |
| `openclaw.channel.configuredState`                                                         | 輕量的已設定狀態檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已存在僅限環境變數的設定？」                                                                           |
| `openclaw.channel.persistedAuthState`                                                      | 輕量的持久化驗證檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 提供給內建與外部發布 Plugin 的安裝/更新提示。                                                                                                                                       |
| `openclaw.install.defaultChoice`                                                           | 當有多個安裝來源可用時，偏好的安裝路徑。                                                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝與更新流程會用它驗證擷取到的成品。                                                                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 當設定無效時，允許一條狹窄的內建 Plugin 重新安裝復原路徑。                                                                                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允許僅設定用的通道介面在啟動期間、完整通道 Plugin 之前載入。                                                                                                                       |

Manifest 中繼資料會決定執行階段載入前，哪些提供者/通道/設定選項會出現在
初始設定中。`package.json#openclaw.install` 會告訴
初始設定，當使用者選擇其中一個選項時，要如何擷取或啟用該 Plugin。
不要把安裝提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在非內建 Plugin 來源的安裝與 Manifest
登錄載入期間強制執行。無效值會被拒絕；
較新但有效的值會在較舊主機上略過外部 Plugin。內建來源
Plugin 會被假定與主機 checkout 共同版本化。

官方的隨需安裝中繼資料應在 Plugin 已發布到
ClawHub 時使用 `clawhubSpec`；初始設定會把它視為偏好的遠端來源，並在安裝後
記錄 ClawHub 成品事實。`npmSpec` 仍是尚未移至 ClawHub 的套件的相容性
後備方案。

精確 npm 版本釘選已存在於 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄
項目應將精確規格與 `expectedIntegrity` 配對，讓更新流程在
擷取到的 npm 成品不再符合釘選版本時以封閉方式失敗。
為了相容性，互動式初始設定仍會提供受信任登錄中的 npm 規格，包括裸
套件名稱與 dist-tags。目錄診斷可以
區分精確、浮動、完整性釘選、缺少完整性、套件名稱
不符，以及無效的預設選項來源。當
`expectedIntegrity` 存在但沒有可供其釘選的有效 npm 來源時，也會警告。
當 `expectedIntegrity` 存在時，
安裝/更新流程會強制執行它；省略時，登錄解析會在沒有完整性釘選的情況下
被記錄。

當狀態、通道清單或 SecretRef 掃描需要在不載入完整
執行階段的情況下識別已設定帳戶時，通道 Plugin 應提供 `openclaw.setupEntry`。
設定進入點應公開通道中繼資料，以及設定安全的 config、
狀態與 secrets 轉接器；將網路用戶端、gateway 監聽器與
傳輸執行階段保留在主要擴充進入點中。

執行階段進入點欄位不會覆寫來源進入點欄位的套件邊界檢查。
例如，`openclaw.runtimeExtensions` 無法讓跳出邊界的
`openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 的範圍刻意很窄。它不會
讓任意損壞的設定變得可安裝。目前它只允許安裝
流程從特定過期內建 Plugin 升級失敗中復原，例如
缺少內建 Plugin 路徑，或同一個
內建 Plugin 的過期 `channels.<id>` 項目。無關的設定錯誤仍會阻止安裝，並將操作人員
導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是給小型檢查器
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

當設定、doctor、狀態或唯讀 presence 流程需要在完整通道 Plugin 載入前執行低成本的
是/否驗證探測時使用它。持久化驗證狀態不是
已設定通道狀態：不要使用此中繼資料來自動啟用 Plugin、
修復執行階段依賴項，或決定通道執行階段是否應載入。
目標 export 應是一個只讀取持久化狀態的小型函式；不要
透過完整通道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 對低成本、僅限環境變數的
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

當通道可以從環境變數或其他微小的
非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的
通道執行階段，請改把該邏輯保留在 Plugin `config.hasConfiguredState`
hook 中。

## 探索優先順序（重複的 Plugin id）

OpenClaw 會從多個根目錄探索 Plugin（內建、全域安裝、workspace、明確由設定選取的路徑）。如果兩個探索結果共用相同的 `id`，只會保留**最高優先順序**的 Manifest；較低優先順序的重複項會被捨棄，而不是並排載入。

優先順序，由高到低：

1. **設定選取** — 明確釘選在 `plugins.entries.<id>` 中的路徑
2. **內建** — 隨 OpenClaw 出貨的 Plugin
3. **全域安裝** — 安裝到全域 OpenClaw Plugin 根目錄中的 Plugin
4. **Workspace** — 相對於目前 workspace 探索到的 Plugin

影響：

- 位於 workspace 中的內建 Plugin fork 或過期副本不會遮蔽內建建置。
- 若要真的用本機版本覆寫內建 Plugin，請透過 `plugins.entries.<id>` 釘選它，使其依優先順序勝出，而不是依賴 workspace 探索。
- 重複項捨棄會被記錄，讓 Doctor 與啟動診斷可以指向被捨棄的副本。
- 設定選取的重複覆寫會在診斷中表述為明確覆寫，但仍會警告，讓過期 fork 與意外遮蔽保持可見。

## JSON Schema 需求

- **每個 Plugin 都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空 schema 可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段驗證。
- 使用新設定鍵擴充或 fork 內建 Plugin 時，請同時更新該 Plugin 的 `openclaw.plugin.json` `configSchema`。內建 Plugin schema 是嚴格的，因此如果在使用者設定中新增 `plugins.entries.<id>.config.myNewKey`，卻沒有把 `myNewKey` 加到 `configSchema.properties`，就會在 Plugin 執行階段載入前被拒絕。

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

- 未知的 `channels.*` 鍵是**錯誤**，除非通道 id 由
  Plugin Manifest 宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 與 `plugins.slots.*`
  必須引用**可探索**的 Plugin id。未知 id 是**錯誤**。
- 如果 Plugin 已安裝，但 Manifest 或 schema 損壞或缺失，
  驗證會失敗，且 Doctor 會回報 Plugin 錯誤。
- 如果 Plugin 設定存在但 Plugin **已停用**，設定會保留，且
  Doctor + 記錄中會顯示**警告**。

完整的 `plugins.*` schema 請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- 資訊清單是**原生 OpenClaw Plugin 的必要項目**，包括從本機檔案系統載入。執行階段仍會另外載入 Plugin 模組；資訊清單只用於探索與驗證。
- 原生資訊清單會以 JSON5 解析，因此只要最終值仍是物件，就接受註解、尾隨逗號和未加引號的鍵。
- 資訊清單載入器只會讀取已文件化的資訊清單欄位。避免使用自訂頂層鍵。
- 當 Plugin 不需要時，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必須保持輕量，且不應匯入大範圍的執行階段程式碼；將它用於靜態提供者目錄中繼資料或範圍狹窄的探索描述元，而不是請求期間的執行。
- 專屬 Plugin 種類透過 `plugins.slots.*` 選取：透過 `plugins.slots.memory` 使用 `kind: "memory"`，透過 `plugins.slots.contextEngine` 使用 `kind: "context-engine"`（預設為 `legacy`）。
- 在此資訊清單中宣告專屬 Plugin 種類。執行階段進入點 `OpenClawPluginDefinition.kind` 已棄用，僅作為舊版 Plugin 的相容性備援保留。
- 環境變數中繼資料（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告性質。狀態、稽核、Cron 傳遞驗證和其他唯讀介面，在將環境變數視為已設定之前，仍會套用 Plugin 信任與有效啟用政策。
- 關於需要提供者程式碼的執行階段精靈中繼資料，請參閱[提供者執行階段鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的 Plugin 依賴原生模組，請記錄建置步驟及任何套件管理員允許清單需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="Building plugins" href="/zh-TW/plugins/building-plugins" icon="rocket">
    Plugin 入門。
  </Card>
  <Card title="Plugin architecture" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK overview" href="/zh-TW/plugins/sdk-overview" icon="book">
    Plugin SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
