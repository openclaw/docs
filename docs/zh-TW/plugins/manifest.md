---
read_when:
    - 你正在建置 OpenClaw 外掛
    - 你需要發佈外掛設定架構，或除錯外掛驗證錯誤
summary: 外掛資訊清單 + JSON 結構描述要求（嚴格設定驗證）
title: 外掛資訊清單
x-i18n:
    generated_at: "2026-06-27T19:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

這個頁面僅適用於 **OpenClaw 原生外掛 manifest**。

如需相容的 bundle 版面配置，請參閱[外掛 bundle](/zh-TW/plugins/bundles)。

相容的 bundle 格式使用不同的 manifest 檔案：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不含 manifest 的預設 Claude 元件
  版面配置
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些 bundle 版面配置，但不會依照此處描述的 `openclaw.plugin.json` schema
進行驗證。

對於相容 bundle，當其版面配置符合 OpenClaw 執行階段預期時，OpenClaw 目前會讀取 bundle 中繼資料加上宣告的
skill roots、Claude command roots、Claude bundle `settings.json` 預設值、
Claude bundle LSP 預設值，以及支援的 hook packs。

每個 OpenClaw 原生外掛都**必須**在**外掛根目錄**中隨附 `openclaw.plugin.json` 檔案。OpenClaw 使用此 manifest 來驗證組態，且**不執行外掛程式碼**。缺少或無效的 manifest 會被視為外掛錯誤，並阻擋組態驗證。

請參閱完整的外掛系統指南：[外掛](/zh-TW/tools/plugin)。
如需原生 capability model 與目前的 external-compatibility 指引：
[Capability model](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的作用

`openclaw.plugin.json` 是 OpenClaw 在**載入你的外掛程式碼之前**讀取的中繼資料。以下所有內容都必須足夠輕量，能在不啟動外掛執行階段的情況下檢查。

**用於：**

- 外掛身分、組態驗證，以及組態 UI 提示
- auth、onboarding 與 setup 中繼資料（alias、auto-enable、provider env vars、auth choices）
- control-plane surfaces 的啟用提示
- shorthand model-family 所有權
- static capability-ownership snapshots（`contracts`）
- 共享 `openclaw qa` 主機可檢查的 QA runner 中繼資料
- 合併到 catalog 與驗證 surfaces 的 channel-specific config 中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼 entrypoints，
或 npm install 中繼資料。那些應放在你的外掛程式碼與 `package.json` 中。

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

## 豐富範例

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

| 欄位                                 | 必填 | 類型                             | 含義                                                                                                                                                                                                                                            |
| ------------------------------------ | ---- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 標準外掛 id。這是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                                       |
| `configSchema`                       | 是   | `object`                         | 此外掛設定的內嵌 JSON Schema。                                                                                                                                                                                                                 |
| `requiresPlugins`                    | 否   | `string[]`                       | 此外掛要生效也必須安裝的外掛 id。探索會讓此外掛保持可載入，但會在缺少任何必要外掛時發出警告。                                                                                                                                                  |
| `enabledByDefault`                   | 否   | `true`                           | 將 bundled 外掛標記為預設啟用。省略它，或設定為任何非 `true` 值，即可讓此外掛預設停用。                                                                                                                                                        |
| `enabledByDefaultOnPlatforms`        | 否   | `string[]`                       | 將 bundled 外掛標記為只在列出的 Node.js 平台上預設啟用，例如 `["darwin"]`。明確設定仍優先。                                                                                                                                                    |
| `legacyPluginIds`                    | 否   | `string[]`                       | 會正規化為此標準外掛 id 的舊版 id。                                                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 當 auth、設定或模型參照提到它們時，應自動啟用此外掛的提供者 id。                                                                                                                                                                               |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 宣告由 `plugins.slots.*` 使用的互斥外掛種類。                                                                                                                                                                                                  |
| `channels`                           | 否   | `string[]`                       | 此外掛擁有的頻道 id。用於探索與設定驗證。                                                                                                                                                                                                      |
| `providers`                          | 否   | `string[]`                       | 此外掛擁有的提供者 id。                                                                                                                                                                                                                        |
| `providerCatalogEntry`               | 否   | `string`                         | 輕量提供者目錄模組路徑，相對於外掛根目錄，用於可在不啟動完整外掛執行階段的情況下載入、受清單範圍約束的提供者目錄中繼資料。                                                                                                                    |
| `modelSupport`                       | 否   | `object`                         | 清單擁有的模型系列中繼資料簡寫，用於在執行階段之前自動載入此外掛。                                                                                                                                                                            |
| `modelCatalog`                       | 否   | `object`                         | 此外掛擁有的提供者所用的宣告式模型目錄中繼資料。這是未來唯讀清單、入門設定、模型選擇器、別名與抑制功能的控制平面合約，不需要載入外掛執行階段。                                                                                                |
| `modelPricing`                       | 否   | `object`                         | 提供者擁有的外部價格查詢政策。用它讓本機/自架提供者選擇不使用遠端價格目錄，或將提供者參照對應到 OpenRouter/LiteLLM 目錄 id，而不在核心中硬編碼提供者 id。                                                                                       |
| `modelIdNormalization`               | 否   | `object`                         | 提供者擁有的模型 id 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                                                           |
| `providerEndpoints`                  | 否   | `object[]`                       | 清單擁有的端點 host/baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                                                                     |
| `providerRequest`                    | 否   | `object`                         | 通用請求政策在提供者執行階段載入前使用的低成本提供者系列與請求相容性中繼資料。                                                                                                                                                                |
| `secretProviderIntegrations`         | 否   | `Record<string, object>`         | 宣告式 SecretRef exec 提供者預設，讓 setup 或安裝介面可提供，而不必在核心中硬編碼提供者專屬整合。                                                                                                                                              |
| `cliBackends`                        | 否   | `string[]`                       | 此外掛擁有的命令列介面推論後端 id。用於從明確設定參照在啟動時自動啟動。                                                                                                                                                                      |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 提供者或命令列介面後端參照，其外掛擁有的合成 auth hook 應在執行階段載入前的冷啟動模型探索期間被探測。                                                                                                                                         |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | bundled 外掛擁有的佔位 API key 值，代表非機密的本機、OAuth 或環境憑證狀態。                                                                                                                                                                   |
| `commandAliases`                     | 否   | `object[]`                       | 此外掛擁有的命令名稱，應在執行階段載入前產生具外掛感知能力的設定與命令列介面診斷。                                                                                                                                                            |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 已棄用的提供者 auth/status 查詢相容性 env 中繼資料。新外掛請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此項。                                                                                                             |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 應重用另一個提供者 id 進行 auth 查詢的提供者 id，例如共用基底提供者 API key 與 auth profiles 的 coding 提供者。                                                                                                                                |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 可在不載入外掛程式碼的情況下檢查的低成本頻道 env 中繼資料。將此用於泛用啟動/設定輔助工具應能看見的 env 驅動頻道 setup 或 auth 介面。                                                                                                  |
| `providerAuthChoices`                | 否   | `object[]`                       | 用於入門設定選擇器、偏好提供者解析與簡單命令列介面旗標接線的低成本 auth 選項中繼資料。                                                                                                                                                        |
| `activation`                         | 否   | `object`                         | 用於啟動、提供者、命令、頻道、路由與 capability 觸發載入的低成本啟動規劃器中繼資料。僅為中繼資料；外掛執行階段仍擁有實際行為。                                                                                                                |
| `setup`                              | 否   | `object`                         | 探索與 setup 介面可在不載入外掛執行階段的情況下檢查的低成本 setup/入門設定描述子。                                                                                                                                                            |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` host 在外掛執行階段載入前使用的低成本 QA runner 描述子。                                                                                                                                                                    |
| `contracts`                          | 否   | `object`                         | 外部 auth hooks、embeddings、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search 與 tool ownership 的靜態 capability 擁有權快照。                 |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 在 `contracts.mediaUnderstandingProviders` 中宣告的提供者 id 所用的低成本 media-understanding 預設值。                                                                                                                                          |
| `imageGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.imageGenerationProviders` 中宣告的提供者 id 所用的低成本 image-generation auth 中繼資料，包括提供者擁有的 auth 別名與基底 URL 防護。                                                                                             |
| `videoGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.videoGenerationProviders` 中宣告的提供者 id 所用的低成本 video-generation auth 中繼資料，包括提供者擁有的 auth 別名與基底 URL 防護。                                                                                             |
| `musicGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.musicGenerationProviders` 中宣告的提供者 id 所用的低成本 music-generation auth 中繼資料，包括提供者擁有的 auth 別名與基底 URL 防護。                                                                                             |
| `toolMetadata`                       | 否       | `Record<string, object>`         | 在 `contracts.tools` 中宣告、由外掛擁有的工具所用的低成本可用性中繼資料。當工具不應載入 runtime，除非存在設定、環境或驗證證據時使用。                                                                       |
| `channelConfigs`                     | 否       | `Record<string, object>`         | 由 manifest 擁有的頻道設定中繼資料，會在 runtime 載入前合併到探索與驗證表面。                                                                                                                                      |
| `skills`                             | 否       | `string[]`                       | 要載入的 Skill 目錄，相對於外掛根目錄。                                                                                                                                                                                         |
| `name`                               | 否       | `string`                         | 人類可讀的外掛名稱。                                                                                                                                                                                                                     |
| `description`                        | 否       | `string`                         | 顯示於外掛表面的簡短摘要。                                                                                                                                                                                                         |
| `icon`                               | 否       | `string`                         | 用於 marketplace/catalog 卡片的 HTTPS 圖片 URL。ClawHub 接受任何有效的 `https://` URL，並在此項省略或無效時退回使用預設外掛圖示。                                                                              |
| `version`                            | 否       | `string`                         | 資訊性的外掛版本。                                                                                                                                                                                                                   |
| `uiHints`                            | 否       | `Record<string, object>`         | 設定欄位的 UI 標籤、預留位置與敏感性提示。                                                                                                                                                                               |

## 生成提供者中繼資料參考

生成提供者中繼資料欄位描述在相符的 `contracts.*GenerationProviders` 清單中宣告之提供者的靜態驗證訊號。OpenClaw 會在提供者執行階段載入前讀取這些欄位，讓核心工具不必匯入每個提供者外掛，就能判斷某個生成提供者是否可用。

這些欄位只應用於低成本、宣告式的事實。傳輸、請求轉換、權杖重新整理、憑證驗證，以及實際生成行為，都保留在外掛執行階段中。

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

| 欄位                   | 必填 | 類型       | 含義                                                                                                                                          |
| ---------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 否   | `string[]` | 應計為生成提供者靜態驗證別名的其他提供者 ID。                                                                                                |
| `authProviders`        | 否   | `string[]` | 其已設定驗證設定檔應計為此生成提供者驗證的提供者 ID。                                                                                        |
| `configSignals`        | 否   | `object[]` | 可在沒有驗證設定檔或環境變數的情況下設定的本機或自行託管提供者，其低成本、僅限設定的可用性訊號。                                              |
| `authSignals`          | 否   | `object[]` | 明確的驗證訊號。存在時，這些訊號會取代來自提供者 ID、`aliases` 與 `authProviders` 的預設訊號集。                                             |
| `referenceAudioInputs` | 否   | `boolean`  | 僅限影片生成。當提供者接受參考音訊資產時設為 `true`；否則 `video_generate` 會隱藏音訊參考參數。                                             |

每個 `configSignals` 項目支援：

| 欄位             | 必填 | 類型       | 含義                                                                                                                                                                           |
| ---------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | 是   | `string`   | 要檢查之外掛所擁有設定物件的點路徑，例如 `plugins.entries.example.config`。                                                                                                    |
| `overlayPath`    | 否   | `string`   | 根設定內的點路徑，其物件應在評估訊號前覆蓋根物件。將此用於特定能力的設定，例如 `image`、`video` 或 `music`。                                                                 |
| `overlayMapPath` | 否   | `string`   | 根設定內的點路徑，其物件值應各自覆蓋根物件。將此用於具名帳戶對應，例如 `accounts`，其中任何已設定的帳戶都應符合資格。                                                       |
| `required`       | 否   | `string[]` | 有效設定內必須具有已設定值的點路徑。字串不得為空；物件和陣列不得為空。                                                                                                       |
| `requiredAny`    | 否   | `string[]` | 有效設定內至少必須有一個具備已設定值的點路徑。                                                                                                                               |
| `mode`           | 否   | `object`   | 有效設定內的選用字串模式防護。當僅限設定的可用性只適用於某一模式時使用。                                                                                                     |

每個 `mode` 防護支援：

| 欄位         | 必填 | 類型       | 含義                                                                   |
| ------------ | ---- | ---------- | ---------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效設定內的點路徑。預設為 `mode`。                                    |
| `default`    | 否   | `string`   | 當設定省略該路徑時使用的模式值。                                       |
| `allowed`    | 否   | `string[]` | 若存在，只有在有效模式是這些值之一時，訊號才會通過。                   |
| `disallowed` | 否   | `string[]` | 若存在，當有效模式是這些值之一時，訊號會失敗。                         |

每個 `authSignals` 項目支援：

| 欄位              | 必填 | 類型     | 含義                                                                                                                                                 |
| ----------------- | ---- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已設定驗證設定檔中檢查的提供者 ID。                                                                                                             |
| `providerBaseUrl` | 否   | `object` | 選用防護，只有在參照的已設定提供者使用允許的基底 URL 時，才讓此訊號計入。當驗證別名只對特定 API 有效時使用。                                      |

每個 `providerBaseUrl` 防護支援：

| 欄位              | 必填 | 類型       | 含義                                                                                                                                     |
| ----------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 應被檢查的提供者設定 ID。                                                                                                   |
| `defaultBaseUrl`  | 否   | `string`   | 當提供者設定省略 `baseUrl` 時要假設的基底 URL。                                                                                          |
| `allowedBaseUrls` | 是   | `string[]` | 此驗證訊號允許的基底 URL。當已設定或預設的基底 URL 不符合這些正規化值之一時，會忽略該訊號。                                             |

## 工具中繼資料參考

`toolMetadata` 使用與生成提供者中繼資料相同的 `configSignals` 和 `authSignals` 形狀，並以工具名稱作為鍵。`contracts.tools` 宣告擁有權。`toolMetadata` 宣告低成本的可用性證據，讓 OpenClaw 不必只為了讓工具工廠回傳 `null` 而匯入外掛執行階段。

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

如果工具沒有 `toolMetadata`，OpenClaw 會保留既有行為，並在工具合約符合政策時載入擁有該工具的外掛。對於工廠依賴驗證或設定的熱路徑工具，外掛作者應宣告 `toolMetadata`，而不是讓核心匯入執行階段來詢問。

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目描述一個入門設定或驗證選項。OpenClaw 會在提供者執行階段載入前讀取此資訊。提供者設定清單會使用這些資訊清單選項、由描述元衍生的設定選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填 | 類型                                                                  | 含義                                                                                                             |
| --------------------- | ---- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此選項所屬的供應者 id。                                                                                         |
| `method`              | 是   | `string`                                                              | 要分派到的驗證方法 id。                                                                                         |
| `choiceId`            | 是   | `string`                                                              | 供入門設定與命令列介面流程使用的穩定驗證選項 id。                                                               |
| `choiceLabel`         | 否   | `string`                                                              | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                                      |
| `choiceHint`          | 否   | `string`                                                              | 選擇器的簡短輔助文字。                                                                                          |
| `assistantPriority`   | 否   | `number`                                                              | 在助理驅動的互動式選擇器中，數值較低者排序較前。                                                                |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 從助理選擇器中隱藏此選項，但仍允許手動命令列介面選取。                                                          |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 應將使用者重新導向到此替代選項的舊版選項 id。                                                                   |
| `groupId`             | 否   | `string`                                                              | 用於將相關選項分組的選用群組 id。                                                                               |
| `groupLabel`          | 否   | `string`                                                              | 該群組面向使用者的標籤。                                                                                        |
| `groupHint`           | 否   | `string`                                                              | 群組的簡短輔助文字。                                                                                            |
| `optionKey`           | 否   | `string`                                                              | 簡單單旗標驗證流程的內部選項鍵。                                                                                |
| `cliFlag`             | 否   | `string`                                                              | 命令列介面旗標名稱，例如 `--openrouter-api-key`。                                                               |
| `cliOption`           | 否   | `string`                                                              | 完整命令列介面選項形式，例如 `--openrouter-api-key <key>`。                                                     |
| `cliDescription`      | 否   | `string`                                                              | 命令列介面說明中使用的描述。                                                                                    |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此選項應出現在哪些入門設定介面。若省略，預設為 `["text-inference"]`。                                           |

## commandAliases 參考

當外掛擁有使用者可能會誤放到 `plugins.allow` 中，或嘗試作為根命令列介面命令執行的執行階段命令名稱時，請使用 `commandAliases`。OpenClaw
會使用此中繼資料進行診斷，而不匯入外掛執行階段程式碼。

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

| 欄位         | 必填 | 類型              | 含義                                                                 |
| ------------ | ---- | ----------------- | -------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 屬於此外掛的命令名稱。                                               |
| `kind`       | 否   | `"runtime-slash"` | 將別名標記為聊天斜線命令，而不是根命令列介面命令。                   |
| `cliCommand` | 否   | `string`          | 若存在，用於建議命令列介面操作的相關根命令列介面命令。               |

## activation 參考

當外掛可以低成本宣告哪些控制平面事件應將其納入啟用/載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證外掛程式碼已經執行。啟用規劃器會使用這些欄位，在退回使用現有清單擁有權中繼資料之前縮小候選外掛範圍，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

優先使用已能描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、設定描述子或 `contracts`
能表達關係時，請使用那些欄位。若需要無法由那些擁有權欄位表示的額外規劃器提示，才使用 `activation`。
針對 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等命令列介面執行階段別名，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅適用於尚未有擁有權欄位的內嵌代理程式工具鏈 id。

此區塊僅為中繼資料。它不會註冊執行階段行為，也不會取代 `register(...)`、`setupEntry` 或其他執行階段/外掛進入點。目前的使用端會先將其作為縮小範圍提示，再進行較廣泛的外掛載入，因此缺少非啟動啟用中繼資料通常只會影響效能；只要清單擁有權退回機制仍存在，就不應改變正確性。

每個外掛都應有意識地設定 `activation.onStartup`。只有在外掛必須於閘道啟動期間執行時，才將其設為 `true`。當外掛在啟動時為惰性，且應只由較窄的觸發條件載入時，將其設為 `false`。
省略 `onStartup` 不再會隱含地在啟動時載入外掛；請使用明確的啟用中繼資料來表示啟動、頻道、設定、代理程式工具鏈、記憶體或其他較窄的啟用觸發條件。

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

| 欄位               | 必填 | 類型                                                 | 含義                                                                                                                                                                   |
| ------------------ | ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 明確的閘道啟動啟用。每個外掛都應設定此欄位。`true` 會在啟動期間匯入外掛；`false` 會使其在啟動時保持延遲載入，除非另一個符合的觸發條件要求載入。 |
| `onProviders`      | 否   | `string[]`                                           | 應將此外掛納入啟用/載入計畫的供應者 id。                                                                                                                              |
| `onAgentHarnesses` | 否   | `string[]`                                           | 應將此外掛納入啟用/載入計畫的內嵌代理程式工具鏈執行階段 id。命令列介面後端別名請使用頂層 `cliBackends`。                                                            |
| `onCommands`       | 否   | `string[]`                                           | 應將此外掛納入啟用/載入計畫的命令 id。                                                                                                                                |
| `onChannels`       | 否   | `string[]`                                           | 應將此外掛納入啟用/載入計畫的頻道 id。                                                                                                                                |
| `onRoutes`         | 否   | `string[]`                                           | 應將此外掛納入啟用/載入計畫的路由種類。                                                                                                                               |
| `onConfigPaths`    | 否   | `string[]`                                           | 當路徑存在且未被明確停用時，應將此外掛納入啟動/載入計畫的相對於根目錄的設定路徑。                                                                                    |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時優先使用較窄的欄位。                                                                                                        |

目前的即時使用端：

- 閘道啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入
- 由命令觸發的命令列介面規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 代理程式執行階段啟動規劃會使用 `activation.onAgentHarnesses` 處理內嵌工具鏈，並使用頂層 `cliBackends[]` 處理命令列介面執行階段別名
- 由頻道觸發的設定/頻道規劃在缺少明確頻道啟用中繼資料時，會退回使用舊版 `channels[]` 擁有權
- 啟動外掛規劃會使用 `activation.onConfigPaths` 處理非頻道根設定介面，例如內建瀏覽器外掛的 `browser` 區塊
- 由供應者觸發的設定/執行階段規劃在缺少明確供應者啟用中繼資料時，會退回使用舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權

規劃器診斷可以區分明確啟用提示與清單擁有權退回。例如，`activation-command-hint` 表示
`activation.onCommands` 符合，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤供主機診斷與測試使用；外掛作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當外掛在共用的 `openclaw qa` 根目錄下提供一個或多個傳輸執行器時，請使用 `qaRunners`。保持此中繼資料低成本且靜態；外掛執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際命令列介面註冊，該介面會匯出 `qaRunnerCliRegistrations`。

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
| `commandName` | 是   | `string` | 掛載在 `openclaw qa` 底下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 共用主機需要 stub 命令時使用的備援說明文字。                      |

## setup 參考

當設定與導覽介面需要在執行階段載入前取得低成本、外掛擁有的中繼資料時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並持續描述命令列介面推論後端。`setup.cliBackends` 是設定專用的描述元介面，用於應保持僅含中繼資料的控制平面/設定流程。

存在時，`setup.providers` 與 `setup.cliBackends` 是設定探索偏好的描述元優先查找介面。如果描述元只縮小候選外掛範圍，而設定仍需要更完整的設定期間執行階段鉤子，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備援執行路徑。

OpenClaw 也會在通用提供者驗證與環境變數查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在棄用期間仍會透過相容性配接器受到支援，但仍使用它的非內建外掛會收到清單診斷。新外掛應將設定/狀態環境中繼資料放在 `setup.providers[].envVars`。

當沒有設定項目可用，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的設定選項。明確的 `providerAuthChoices` 項目仍優先用於自訂標籤、命令列介面旗標、導覽範圍與助理中繼資料。

只有在這些描述元足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述元合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 進行設定查找。如果僅描述元外掛仍交付其中一個設定執行階段項目，OpenClaw 會回報附加診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版備援行為，因此已新增描述元但未加上該旗標的現有外掛不會中斷。

由於設定查找可以執行外掛擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 與 `setup.cliBackends[]` 值必須在所有已探索外掛中保持唯一。擁有權不明確時會失敗關閉，而不是依探索順序挑選勝者。

當設定執行階段確實執行時，如果 `setup-api` 註冊了清單描述元未宣告的提供者或命令列介面後端，或如果描述元沒有對應的執行階段註冊，設定登錄診斷會回報描述元漂移。這些診斷是附加性的，不會拒絕舊版外掛。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 意義                                                                                             |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | 在設定或導覽期間公開的提供者 id。請讓正規化後的 id 在全域保持唯一。                              |
| `authMethods`  | 否   | `string[]` | 此提供者在不載入完整執行階段的情況下支援的設定/驗證方法 id。                                    |
| `envVars`      | 否   | `string[]` | 通用設定/狀態介面可在外掛執行階段載入前檢查的環境變數。                                         |
| `authEvidence` | 否   | `object[]` | 針對可透過非秘密標記驗證的提供者，進行低成本本機驗證證據檢查。                                  |

`authEvidence` 用於提供者擁有、可在不載入執行階段程式碼的情況下驗證的本機認證標記。這些檢查必須保持低成本且本機化：不進行網路呼叫、不讀取鑰匙圈或秘密管理器、不執行 shell 命令，也不探測提供者 API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 意義                                                                                                           |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | 否   | `string`   | 包含明確認證檔案路徑的環境變數。                                                                               |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機認證檔案路徑。支援 `${HOME}` 與 `${APPDATA}`。                         |
| `requiresAnyEnv`   | 否   | `string[]` | 列出的環境變數中至少一個必須非空，該證據才有效。                                                              |
| `requiresAllEnv`   | 否   | `string[]` | 列出的每個環境變數都必須非空，該證據才有效。                                                                  |
| `credentialMarker` | 是   | `string`   | 證據存在時傳回的非秘密標記。                                                                                  |
| `source`           | 否   | `string`   | 用於驗證/狀態輸出的使用者可見來源標籤。                                                                       |

### setup 欄位

| 欄位               | 必填 | 類型       | 意義                                                                                          |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在設定與導覽期間公開的提供者設定描述元。                                                      |
| `cliBackends`      | 否   | `string[]` | 用於描述元優先設定查找的設定期間後端 id。請讓正規化後的 id 在全域保持唯一。                  |
| `configMigrations` | 否   | `string[]` | 由此外掛設定介面擁有的設定遷移 id。                                                          |
| `requiresRuntime`  | 否   | `boolean`  | 設定在描述元查找後是否仍需要執行 `setup-api`。                                                |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型呈現提示的映射。

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

| 欄位          | 類型       | 意義                       |
| ------------- | ---------- | -------------------------- |
| `label`       | `string`   | 使用者可見的欄位標籤。     |
| `help`        | `string`   | 簡短輔助文字。             |
| `tags`        | `string[]` | 選用 UI 標籤。             |
| `advanced`    | `boolean`  | 將欄位標記為進階。         |
| `sensitive`   | `boolean`  | 將欄位標記為秘密或敏感。   |
| `placeholder` | `string`   | 表單輸入的預留位置文字。   |

## contracts 參考

只有在 OpenClaw 可以不匯入外掛執行階段就讀取的靜態能力擁有權中繼資料中，才使用 `contracts`。

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
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每個清單都是選用的：

| 欄位                             | 類型       | 含義                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex 應用程式伺服器擴充功能工廠 ID，目前為 `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | 此外掛可為其註冊工具結果中介軟體的執行階段 ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | 已安裝外掛可註冊的外掛本機受信任前置工具政策 ID。內建外掛可在沒有此欄位的情況下註冊政策。 |
| `externalAuthProviders`          | `string[]` | 此外掛擁有其外部驗證設定檔鉤子的提供者 ID。                                                                      |
| `embeddingProviders`             | `string[]` | 此外掛擁有的一般嵌入提供者 ID，用於可重複使用的向量嵌入，包括記憶體。                                 |
| `speechProviders`                | `string[]` | 此外掛擁有的語音提供者 ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | 此外掛擁有的即時轉錄提供者 ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | 此外掛擁有的即時語音提供者 ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | 已棄用的此外掛擁有的記憶體專用嵌入提供者 ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 此外掛擁有的媒體理解提供者 ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 此外掛擁有的逐字稿來源提供者 ID。                                                                                     |
| `imageGenerationProviders`       | `string[]` | 此外掛擁有的影像生成提供者 ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | 此外掛擁有的影片生成提供者 ID。                                                                                      |
| `webFetchProviders`              | `string[]` | 此外掛擁有的網頁擷取提供者 ID。                                                                                             |
| `webSearchProviders`             | `string[]` | 此外掛擁有的網頁搜尋提供者 ID。                                                                                            |
| `migrationProviders`             | `string[]` | 此外掛為 `openclaw migrate` 擁有的匯入提供者 ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | 已驗證外掛 HTTP 路由的保留權益，用於在程序內分派閘道方法。                                  |
| `tools`                          | `string[]` | 此外掛擁有的代理工具名稱。                                                                                                   |

`contracts.embeddedExtensionFactories` 會保留給內建 Codex
僅限應用程式伺服器的擴充功能工廠。內建工具結果轉換應改為
宣告 `contracts.agentToolResultMiddleware`，並使用
`api.registerAgentToolResultMiddleware(...)` 註冊。已安裝外掛只有在明確啟用時，
且只針對它們在 `contracts.agentToolResultMiddleware` 中宣告的執行階段，
才可使用相同的中介軟體銜接點。

需要主機受信任前置工具政策層級的已安裝外掛，必須在
`contracts.trustedToolPolicies` 中宣告每個已註冊的本機 ID，並且必須明確啟用。
內建外掛會保留既有的受信任政策路徑，但具有未宣告政策 ID 的已安裝
外掛會在註冊前被拒絕。政策 ID 的範圍限定於註冊該政策的外掛，
因此兩個外掛都可以宣告並註冊 `workflow-budget`；單一外掛不得
重複註冊相同的本機 ID。

執行階段 `api.registerTool(...)` 註冊必須符合 `contracts.tools`。
工具探索會使用此清單，只載入可擁有所請求工具的外掛執行階段。

實作 `resolveExternalAuthProfiles` 的提供者外掛應宣告
`contracts.externalAuthProviders`；未宣告的外部驗證鉤子會被忽略。

一般嵌入提供者應針對每個以 `api.registerEmbeddingProvider(...)`
註冊的配接器宣告 `contracts.embeddingProviders`。請將一般合約用於
可重複使用的向量生成，包括由記憶體搜尋使用的提供者。
`contracts.memoryEmbeddingProviders` 是已棄用的記憶體專用相容性，
僅在既有提供者遷移到通用嵌入提供者銜接點期間保留。

`contracts.gatewayMethodDispatch` 目前接受
`"authenticated-request"`。這是原生外掛 HTTP 路由的 API 衛生閘門，
用於有意在程序內分派閘道控制平面方法，而不是針對惡意原生外掛的沙箱。
僅將它用於已嚴格審查、且已要求閘道 HTTP 驗證的內建/操作員介面。

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證後援優先順序，或在執行階段載入前
通用核心輔助工具需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。
鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

| 欄位                   | 類型                                | 含義                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供者公開的媒體能力。                                 |
| `defaultModels`        | `Record<string, string>`            | 未在設定中指定模型時使用的能力到模型預設值。      |
| `autoPriority`         | `Record<string, number>`            | 數字較小者在自動憑證型提供者後援排序中較早。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供者支援的原生文件輸入。                            |

## channelConfigs 參考

當頻道外掛需要在執行階段載入前取得低成本設定中繼資料時，請使用
`channelConfigs`。唯讀頻道設定/狀態探索可在沒有可用設定項目時，
或當 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，
直接將此中繼資料用於已設定的外部頻道。

`channelConfigs` 是外掛資訊清單中繼資料，不是新的頂層使用者設定區段。
使用者仍會在 `channels.<channel-id>` 下設定頻道執行個體。
OpenClaw 會讀取資訊清單中繼資料，以在外掛執行階段程式碼執行前，
判斷哪個外掛擁有該已設定頻道。

對於頻道外掛，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 會驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 會驗證 `channels.<channel-id>`

宣告 `channels[]` 的非內建外掛，也應宣告相符的 `channelConfigs` 項目。
若沒有這些項目，OpenClaw 仍可載入外掛，但冷路徑設定結構描述、設定流程與
Control UI 介面無法在外掛執行階段執行前得知頻道所擁有選項的形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和
`nativeSkillsAutoEnabled` 可為命令設定檢查宣告靜態 `auto` 預設值，
這些檢查會在頻道執行階段載入前執行。內建頻道也可以透過
`package.json#openclaw.channel.commands` 發布相同預設值，
與其其他套件擁有的頻道目錄中繼資料並列。

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

| 欄位          | 類型                     | 含義                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的頻道設定項目都必須提供。         |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤/預留文字/敏感提示。          |
| `label`       | `string`                 | 當執行階段中繼資料尚未就緒時，合併到選擇器和檢視介面的頻道標籤。 |
| `description` | `string`                 | 用於檢視和目錄介面的簡短頻道描述。                               |
| `commands`    | `object`                 | 執行階段前設定檢查所用的靜態原生命令與原生 skill 自動預設值。       |
| `preferOver`  | `string[]`               | 此頻道在選擇介面中應優先於的舊版或較低優先順序外掛 ID。    |

### 取代另一個頻道外掛

當你的外掛是某個頻道 ID 的偏好擁有者，而另一個外掛也能提供該頻道 ID 時，
請使用 `preferOver`。常見情況包括重新命名的外掛 ID、取代內建外掛的
獨立外掛，或為了設定相容性而保留相同頻道 ID 的維護分支。

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

當設定了 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 和
偏好的外掛 ID。如果較低優先順序的外掛只是因為內建或預設啟用而被選取，
OpenClaw 會在有效執行階段設定中停用它，讓單一外掛擁有該頻道及其工具。
明確的使用者選擇仍會優先：如果使用者明確啟用兩個外掛，
OpenClaw 會保留該選擇，並回報重複頻道/工具診斷，而不會靜默變更
所請求的外掛集合。

請將 `preferOver` 的範圍限制在確實可提供相同頻道的外掛 ID。
它不是一般優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在外掛執行階段載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6` 等簡寫模型 ID 推斷你的提供者外掛時，請使用 `modelSupport`。

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
- 如果一個非內建外掛和一個內建外掛都相符，非內建外掛勝出
- 其餘模稜兩可的情況會被忽略，直到使用者或設定指定提供者

欄位：

| 欄位            | 類型       | 意義                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 與簡寫模型 ID 比對的前綴。                                    |
| `modelPatterns` | `string[]` | 移除設定檔後綴後，與簡寫模型 ID 比對的正規表示式來源。                          |

`modelPatterns` 項目會透過 `compileSafeRegex` 編譯，該函式會拒絕包含巢狀重複的模式（例如 `(a+)+$`）。未通過安全檢查的模式會被靜默略過，與語法無效的正規表示式相同。請保持模式簡單，並避免巢狀量詞。

## modelCatalog 參考

當 OpenClaw 應在載入外掛執行階段前知道提供者模型中繼資料時，請使用 `modelCatalog`。這是由清單擁有的來源，用於固定目錄列、提供者別名、抑制規則和探索模式。執行階段重新整理仍屬於提供者執行階段程式碼，但清單會告訴核心何時需要執行階段。

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
| `providers`      | `Record<string, object>`                                 | 此外掛所擁有的提供者 ID 的目錄列。鍵也應出現在頂層 `providers` 中。                                         |
| `aliases`        | `Record<string, object>`                                 | 應解析為所屬提供者的提供者別名，用於目錄或抑制規劃。                                                        |
| `suppressions`   | `object[]`                                               | 此外掛基於提供者特定原因而抑制的其他來源模型列。                                                            |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄是否可從清單中繼資料讀取、重新整理到快取，或需要執行階段。                                        |
| `runtimeAugment` | `boolean`                                                | 只有當提供者執行階段必須在清單/設定規劃後附加目錄列時，才設為 `true`。                                      |

`aliases` 會參與模型目錄規劃的提供者所有權查找。別名目標必須是由同一外掛擁有的頂層提供者。當依提供者篩選的清單使用別名時，OpenClaw 可以讀取所屬清單並套用別名 API/基礎 URL 覆寫，而不載入提供者執行階段。別名不會展開未篩選的目錄列表；廣泛清單只會輸出所屬的標準提供者列。

`suppressions` 取代舊的提供者執行階段 `suppressBuiltInModel` 鉤子。只有當提供者由此外掛擁有，或宣告為指向所屬提供者的 `modelCatalog.aliases` 鍵時，抑制項目才會生效。模型解析期間不再呼叫執行階段抑制鉤子。

提供者欄位：

| 欄位      | 類型                     | 意義                                                         |
| --------- | ------------------------ | ------------------------------------------------------------ |
| `baseUrl` | `string`                 | 此提供者目錄中模型的選用預設基礎 URL。                      |
| `api`     | `ModelApi`               | 此提供者目錄中模型的選用預設 API 配接器。                   |
| `headers` | `Record<string, string>` | 套用至此提供者目錄的選用靜態標頭。                          |
| `models`  | `object[]`               | 必填模型列。沒有 `id` 的列會被忽略。                         |

模型欄位：

| 欄位            | 類型                                                           | 意義                                                                            |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供者本機模型 ID，不含 `provider/` 前綴。                                      |
| `name`          | `string`                                                       | 選用顯示名稱。                                                                  |
| `api`           | `ModelApi`                                                     | 選用的個別模型 API 覆寫。                                                       |
| `baseUrl`       | `string`                                                       | 選用的個別模型基礎 URL 覆寫。                                                   |
| `headers`       | `Record<string, string>`                                       | 選用的個別模型靜態標頭。                                                        |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                                                |
| `reasoning`     | `boolean`                                                      | 模型是否公開推理行為。                                                          |
| `contextWindow` | `number`                                                       | 原生提供者內容視窗。                                                            |
| `contextTokens` | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段內容上限。                       |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出權杖數。                                                        |
| `cost`          | `object`                                                       | 選用的每百萬權杖美元定價，包括選用的 `tieredPricing`。                          |
| `compat`        | `object`                                                       | 符合 OpenClaw 模型設定相容性的選用相容性旗標。                                  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有當列完全不應出現時才抑制。                                        |
| `statusReason`  | `string`                                                       | 與非可用狀態一起顯示的選用原因。                                                |
| `replaces`      | `string[]`                                                     | 此模型取代的較舊提供者本機模型 ID。                                             |
| `replacedBy`    | `string`                                                       | 已棄用列的替代提供者本機模型 ID。                                               |
| `tags`          | `string[]`                                                     | 選擇器和篩選器使用的穩定標籤。                                                  |

抑制欄位：

| 欄位                       | 類型       | 意義                                                                                              |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此外掛擁有，或宣告為所屬別名。                                    |
| `model`                    | `string`   | 要抑制的提供者本機模型 ID。                                                                       |
| `reason`                   | `string`   | 直接要求被抑制列時顯示的選用訊息。                                                               |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的有效提供者基礎 URL 主機選用清單。                                                 |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確提供者設定 `api` 值選用清單。                                                 |

請勿將僅限執行階段的資料放入 `modelCatalog`。只有當清單列完整到足以讓依提供者篩選的清單和選擇器介面略過註冊表/執行階段探索時，才使用 `static`。當清單列是有用的可列出種子或補充項目，但重新整理/快取稍後可加入更多列時，使用 `refreshable`；refreshable 列本身不具權威性。當 OpenClaw 必須載入提供者執行階段才能知道清單時，使用 `runtime`。

## modelIdNormalization 參考

對於必須在提供者執行階段載入前發生、由提供者擁有的低成本模型 ID 清理，請使用 `modelIdNormalization`。這會將短模型名稱、提供者本機舊版 ID，以及代理前綴規則等別名保留在所屬外掛清單中，而不是放在核心模型選擇表中。

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

| 欄位                                 | 類型                    | 意義                                                                                     |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依原樣傳回。                                        |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版提供者/模型重複。                                    |
| `prefixWhenBare`                     | `string`                | 當正規化後的模型 ID 尚未包含 `/` 時要加入的前綴。                                       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。                    |

## providerEndpoints 參考

對於通用要求政策必須在提供者執行階段載入前知道的端點分類，請使用 `providerEndpoints`。核心仍擁有每個 `endpointClass` 的意義；外掛清單擁有主機和基礎 URL 中繼資料。

端點欄位：

| 欄位                           | 類型       | 含義                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                  |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                                 |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機後綴。加上 `.` 前綴可僅比對網域後綴。                                     |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確正規化 HTTP(S) 基底 URL。                                                  |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機中移除的後綴，用來公開 Google Vertex 區域前綴。                                      |

## providerRequest 參考資料

使用 `providerRequest` 存放通用請求政策所需的低成本請求相容性中繼資料，
而不必載入提供者執行階段。請將行為特定的酬載改寫保留在提供者執行階段鉤子
或共用的提供者家族輔助工具中。

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

| 欄位                  | 類型         | 含義                                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | 通用請求相容性決策與診斷所使用的提供者家族標籤。                                     |
| `compatibilityFamily` | `"moonshot"` | 共用請求輔助工具的選用提供者家族相容性分類。                                         |
| `openAICompletions`   | `object`     | OpenAI 相容的補全請求旗標，目前為 `supportsStreamingUsage`。                         |

## secretProviderIntegrations 參考資料

當外掛可以發布可重用的 SecretRef exec 提供者預設時，使用
`secretProviderIntegrations`。OpenClaw 會在外掛執行階段載入前讀取此中繼資料，
將外掛擁有權儲存在 `secrets.providers.<alias>.pluginIntegration`，並將實際的
密鑰解析交給 SecretRef 執行階段。
預設只會公開給捆綁外掛，以及從受管理外掛安裝根目錄探索到的已安裝外掛，
例如 git 和 ClawHub 安裝。

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

映射鍵是整合 ID。如果省略 `providerAlias`，OpenClaw 會使用整合 ID
作為 SecretRef 提供者別名。提供者別名必須符合一般 SecretRef 提供者別名模式，
例如 `team-secrets` 或 `onepassword-work`。

當操作員選取該預設時，OpenClaw 會寫入如下的提供者參照：

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

啟動/重新載入時，OpenClaw 會透過載入目前外掛資訊清單中繼資料、檢查擁有該項的
外掛已安裝且啟用，並從資訊清單具現化 exec 命令來解析該提供者。停用或移除該
外掛會撤銷作用中 SecretRefs 的提供者。想要獨立 exec 設定的操作員仍可直接撰寫
手動 `command`/`args` 提供者。

目前只支援 `source: "exec"` 預設。`command` 必須是 `${node}`，且 `args[0]`
必須是 `./` 外掛根目錄相對的解析器指令碼。OpenClaw 會在啟動/重新載入時將其
具現化為目前的節點可執行檔，以及外掛內指令碼的絕對路徑。節點選項例如
`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print`
不屬於資訊清單預設合約。需要非節點命令的操作員可以直接設定獨立的手動 exec
提供者。

OpenClaw 會根據外掛根目錄，以及對於 `${node}` 預設，根據目前的節點可執行檔目錄
衍生資訊清單預設的 `trustedDirs`。資訊清單撰寫的 `trustedDirs` 會被忽略。
其他 exec 提供者選項，例如 `timeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、
`passEnv` 和 `allowInsecurePath`，會傳遞到一般 SecretRef exec 提供者設定。

## modelPricing 參考資料

當提供者需要在執行階段載入前控制控制平面的定價行為時，使用 `modelPricing`。
閘道定價快取會在不匯入提供者執行階段程式碼的情況下讀取此中繼資料。

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

| 欄位         | 類型              | 含義                                                                                          |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對絕不應擷取 OpenRouter 或 LiteLLM 定價的本機/自託管提供者設為 `false`。                     |
| `openRouter` | `false \| object` | OpenRouter 定價查詢映射。`false` 會停用此提供者的 OpenRouter 查詢。                           |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢映射。`false` 會停用此提供者的 LiteLLM 查詢。                                 |

來源欄位：

| 欄位                       | 類型               | 含義                                                                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 ID 與 OpenClaw 提供者 ID 不同時使用，例如 `zai` 提供者的 `z-ai`。                             |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀提供者/模型參照，適用於 OpenRouter 等代理提供者。                                 |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試像 `claude-opus-4.6` 這樣的點分版本 ID。                     |

### OpenClaw 提供者索引

OpenClaw 提供者索引是由 OpenClaw 擁有的提供者預覽中繼資料，
適用於其外掛可能尚未安裝的提供者。它不是外掛資訊清單的一部分。
外掛資訊清單仍然是已安裝外掛的權威。提供者索引是內部備援合約，
未來的可安裝提供者和預安裝模型選擇器介面會在提供者外掛未安裝時使用它。

目錄權威順序：

1. 使用者設定。
2. 已安裝外掛資訊清單 `modelCatalog`。
3. 來自明確重新整理的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

提供者索引不得包含密鑰、啟用狀態、執行階段鉤子，或即時帳戶特定模型資料。
其預覽目錄使用與外掛資訊清單相同的 `modelCatalog` 提供者列形狀，
但應限於穩定的顯示中繼資料，除非執行階段配接器欄位（例如 `api`、`baseUrl`）、
定價或相容性旗標是刻意與已安裝外掛資訊清單保持一致。具有即時 `/models`
探索的提供者應透過明確的模型目錄快取路徑寫入重新整理後的列，而不是讓一般列表
或上線流程呼叫提供者 API。

提供者索引項目也可攜帶可安裝外掛中繼資料，適用於其外掛已移出核心或尚未安裝的
提供者。此中繼資料鏡像通道目錄模式：套件名稱、npm 安裝規格、預期完整性，以及
低成本的驗證選擇標籤，足以顯示可安裝的設定選項。一旦外掛安裝完成，其資訊清單
即優先，該提供者的提供者索引項目會被忽略。

舊版頂層能力鍵已棄用。使用 `openclaw doctor --fix` 將
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 之下；
一般資訊清單載入不再將這些頂層欄位視為能力擁有權。

## 資訊清單與 package.json

這兩個檔案有不同用途：

| 檔案                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選擇中繼資料，以及必須在外掛程式碼執行前存在的 UI 提示                                                     |
| `package.json`         | npm 中繼資料、依賴項安裝，以及用於進入點、安裝門檻、設定或目錄中繼資料的 `openclaw` 區塊                                      |

如果你不確定某項中繼資料應放在哪裡，請使用這條規則：

- 如果 OpenClaw 必須在載入外掛程式碼前知道它，請放在 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放在 `package.json`

### 影響探索的 package.json 欄位

部分執行階段前外掛中繼資料會刻意放在 `package.json` 的 `openclaw`
區塊下，而不是 `openclaw.plugin.json`。
`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw 外掛合約；
原生外掛必須使用 `openclaw.plugin.json` 加上下方支援的
`package.json#openclaw` 欄位。

重要範例：

| 欄位                                                                                       | 含義                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | 宣告原生外掛進入點。必須保留在外掛套件目錄內。                                                                                                                                    |
| `openclaw.runtimeExtensions`                                                               | 宣告已安裝套件的已建置 JavaScript 執行階段進入點。必須保留在外掛套件目錄內。                                                                                                      |
| `openclaw.setupEntry`                                                                      | 輕量的僅設定用進入點，用於初始設定、延後的頻道啟動，以及唯讀頻道狀態/SecretRef 探索。必須保留在外掛套件目錄內。                                                                |
| `openclaw.runtimeSetupEntry`                                                               | 宣告已安裝套件的已建置 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須保留在外掛套件目錄內。                                                                          |
| `openclaw.channel`                                                                         | 低成本頻道目錄中繼資料，例如標籤、文件路徑、別名和選取文案。                                                                                                                      |
| `openclaw.channel.commands`                                                                | 靜態原生命令與原生技能自動預設中繼資料，供設定、稽核和命令清單介面在頻道執行階段載入前使用。                                                                                   |
| `openclaw.channel.configuredState`                                                         | 輕量已設定狀態檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「僅環境變數設定是否已存在？」                                                                              |
| `openclaw.channel.persistedAuthState`                                                      | 輕量持久化驗證檢查器中繼資料，可在不載入完整頻道執行階段的情況下回答「是否已有任何登入狀態？」                                                                                  |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 給內建和外部發布外掛使用的安裝/更新提示。                                                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | 有多個安裝來源可用時的偏好安裝路徑。                                                                                                                                              |
| `openclaw.install.minHostVersion`                                                          | 最低支援的 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                                    |
| `openclaw.compat.pluginApi`                                                                | 此套件所需的最低 OpenClaw 外掛 API 範圍，使用像 `>=2026.5.27` 這樣的 semver 下限。                                                                                                |
| `openclaw.install.expectedIntegrity`                                                       | 預期的 npm 發行完整性字串，例如 `sha512-...`；安裝和更新流程會用它驗證擷取到的成品。                                                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 在設定無效時允許狹窄的內建外掛重新安裝復原路徑。                                                                                                                                  |
| `openclaw.install.requiredPlatformPackages`                                                | npm 套件別名，當其 lockfile 平台限制符合目前主機時，必須實體化。                                                                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允許設定執行階段頻道介面在 listen 前載入，接著將完整已設定頻道外掛延後到 listen 後啟用。                                                                                         |

清單中繼資料決定哪些提供者/頻道/設定選項會在執行階段載入前出現在
初始設定中。`package.json#openclaw.install` 告訴初始設定流程，當使用者選取其中一個
選項時，如何擷取或啟用該外掛。不要把安裝提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在非內建外掛來源的安裝和清單
登錄載入期間強制執行。無效值會被拒絕；
較新但有效的值會讓外部外掛在較舊主機上被略過。內建來源
外掛會被假定與主機 checkout 同版本。

`openclaw.install.requiredPlatformPackages` 適用於透過選用、平台專屬別名公開
必要原生二進位檔的 npm 套件。為每個受支援的平台別名列出
裸 npm 套件名稱。在 npm install 期間，
OpenClaw 只會驗證其 lockfile 限制符合
目前主機的已宣告別名。如果 npm 回報成功但省略該別名，OpenClaw 會使用
新的快取重試一次；如果別名仍然缺失，則回復該安裝。

`openclaw.compat.pluginApi` 會在非內建
外掛來源的套件安裝期間強制執行。用它表示該
套件建置所依據的 OpenClaw 外掛 SDK/執行階段 API 下限。當
外掛套件需要較新的 API，但仍為其他
流程保留較低的安裝提示時，它可以比 `minHostVersion` 更嚴格。官方 OpenClaw 發行同步預設會將現有官方外掛 API 下限
提升到 OpenClaw 發行版本，但純外掛發行可在套件刻意支援舊主機時保留
較低下限。不要只使用
套件版本作為相容性合約。`peerDependencies.openclaw`
仍是 npm 套件中繼資料；OpenClaw 使用 `openclaw.compat.pluginApi`
合約來做安裝相容性決策。

官方隨需安裝中繼資料在外掛發布於 ClawHub 時應使用 `clawhubSpec`；
初始設定會將其視為偏好的遠端來源，並在安裝後記錄
ClawHub 成品事實。`npmSpec` 仍是尚未移至 ClawHub 的套件的相容性
備援。

精確 npm 版本釘選已存在於 `npmSpec`，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄
項目應將精確規格與 `expectedIntegrity` 搭配，讓更新流程在擷取到的 npm 成品不再符合釘選發行時
以封閉失敗方式停止。
互動式初始設定仍會提供受信任登錄的 npm 規格，包括裸
套件名稱和 dist-tag，以維持相容性。目錄診斷可以
區分精確、浮動、已釘選完整性、缺少完整性、套件名稱
不相符，以及無效的預設選項來源。當
`expectedIntegrity` 存在但沒有可供其釘選的有效 npm 來源時也會警告。
當 `expectedIntegrity` 存在時，
安裝/更新流程會強制執行它；當它被省略時，登錄解析會在沒有完整性釘選的情況下
被記錄。

當狀態、頻道清單或 SecretRef 掃描需要在不載入完整
執行階段的情況下識別已設定帳號時，頻道外掛應提供 `openclaw.setupEntry`。
設定進入點應公開頻道中繼資料，以及設定安全的設定、
狀態和秘密配接器；將網路用戶端、閘道監聽器和
傳輸執行階段保留在主要擴充進入點中。

執行階段進入點欄位不會覆寫來源
進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓
逸出的 `openclaw.extensions` 路徑變成可載入。

`openclaw.install.allowInvalidConfigRecovery` 刻意保持狹窄。它不會
讓任意損壞的設定變得可安裝。目前它只允許安裝
流程從特定過期內建外掛升級失敗中復原，例如
缺少內建外掛路徑，或同一個
內建外掛的過期 `channels.<id>` 項目。不相關的設定錯誤仍會阻擋安裝，並將操作者
導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是微型檢查器
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

當設定、doctor、狀態或唯讀存在性流程需要在完整頻道外掛載入前進行低成本
是/否驗證探測時使用它。持久化驗證狀態
不是已設定頻道狀態：不要使用這個中繼資料來自動啟用外掛、
修復執行階段相依性，或判斷頻道執行階段是否應載入。
目標匯出應該是只讀取持久化狀態的小型函式；不要
透過完整頻道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 對低成本僅環境變數
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

當頻道可以從環境變數或其他小型
非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的
頻道執行階段，請將該邏輯保留在外掛 `config.hasConfiguredState`
hook 中。

## 探索優先順序（重複外掛 id）

OpenClaw 會從多個根目錄探索外掛。關於原始檔案系統掃描
順序，請參閱[外掛掃描
順序](/zh-TW/gateway/configuration-reference#plugin-scan-order)。如果兩個探索結果
共用相同的 `id`，只會保留**最高優先順序**的清單；
較低優先順序的重複項目會被丟棄，而不是並排載入。

優先順序，由高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **內建** — 隨 OpenClaw 一起出貨的外掛
3. **全域安裝** — 安裝到全域 OpenClaw 外掛根目錄中的外掛
4. **工作區** — 相對於目前工作區探索到的外掛

影響：

- 位於工作區中的內建外掛 fork 或過期副本不會遮蔽內建建置。
- 若要實際用本機外掛覆寫內建外掛，請透過 `plugins.entries.<id>` 釘選它，使其因優先順序勝出，而不是依賴工作區探索。
- 重複項目被丟棄時會記錄日誌，讓 Doctor 和啟動診斷可以指出被捨棄的副本。
- 設定選取的重複覆寫在診斷中會表述為明確覆寫，但仍會警告，讓過期 fork 和意外遮蔽保持可見。

## JSON Schema 需求

- **每個外掛都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空結構描述是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- 結構描述會在讀取/寫入設定時驗證，而不是在執行階段驗證。
- 使用新的設定鍵擴充或分支內建外掛時，請同時更新該外掛的 `openclaw.plugin.json` `configSchema`。內建外掛結構描述是嚴格的，因此如果在使用者設定中加入 `plugins.entries.<id>.config.myNewKey`，但沒有將 `myNewKey` 加入 `configSchema.properties`，會在外掛執行階段載入前遭到拒絕。

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

- 未知的 `channels.*` 鍵是**錯誤**，除非該頻道 ID 是由
  外掛資訊清單宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必須參照**可探索**的外掛 ID。未知 ID 是**錯誤**。
- 如果外掛已安裝，但資訊清單或結構描述損壞或遺失，
  驗證會失敗，Doctor 會回報外掛錯誤。
- 如果外掛設定存在，但外掛已**停用**，設定會保留，並且
  Doctor + 日誌中會顯示**警告**。

完整的 `plugins.*` 結構描述請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- **原生 OpenClaw 外掛**必須有資訊清單，包括從本機檔案系統載入的外掛。執行階段仍會另外載入外掛模組；資訊清單只用於探索 + 驗證。
- 原生資訊清單會使用 JSON5 解析，因此只要最終值仍然是物件，就接受註解、尾隨逗號和未加引號的鍵。
- 資訊清單載入器只會讀取已文件化的資訊清單欄位。避免使用自訂頂層鍵。
- 當外掛不需要時，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerCatalogEntry` 必須保持輕量，不應匯入廣泛的執行階段程式碼；請將它用於靜態供應器目錄中繼資料或範圍明確的探索描述元，而不是請求時執行。
- 專用外掛種類透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`，`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此資訊清單中宣告專用外掛種類。執行階段入口的 `OpenClawPluginDefinition.kind` 已棄用，且僅保留作為舊版外掛的相容性後援。
- 環境變數中繼資料（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告性。狀態、稽核、排程傳遞驗證和其他唯讀介面，在將環境變數視為已設定之前，仍會套用外掛信任與有效啟用政策。
- 需要供應器程式碼的執行階段精靈中繼資料，請參閱[供應器執行階段鉤子](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的外掛依賴原生模組，請記錄建置步驟和任何套件管理器允許清單需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="建置外掛" href="/zh-TW/plugins/building-plugins" icon="rocket">
    開始使用外掛。
  </Card>
  <Card title="外掛架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與能力模型。
  </Card>
  <Card title="SDK 概觀" href="/zh-TW/plugins/sdk-overview" icon="book">
    外掛 SDK 參考與子路徑匯入。
  </Card>
</CardGroup>
