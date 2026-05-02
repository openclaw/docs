---
read_when:
    - 您正在建立 OpenClaw Plugin
    - 您需要發佈 Plugin 設定結構描述，或偵錯 Plugin 驗證錯誤
summary: Plugin 清單 + JSON 結構描述要求（嚴格設定驗證）
title: Plugin 資訊清單
x-i18n:
    generated_at: "2026-05-02T02:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fb98614783b679d6b49d2237148765708e5c5fc2ee40162d3ddd4752f763c2
    source_path: plugins/manifest.md
    workflow: 16
---

此頁僅適用於 **原生 OpenClaw Plugin manifest**。

如需相容的套件配置，請參閱 [Plugin 套件](/zh-TW/plugins/bundles)。

相容套件格式使用不同的 manifest 檔案：

- Codex 套件：`.codex-plugin/plugin.json`
- Claude 套件：`.claude-plugin/plugin.json`，或不含 manifest 的預設 Claude 元件
  配置
- Cursor 套件：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些套件配置，但不會依照此處描述的 `openclaw.plugin.json` schema 進行驗證。

對於相容套件，OpenClaw 目前會在配置符合 OpenClaw 執行階段預期時，讀取套件中繼資料以及宣告的 skill 根目錄、Claude 命令根目錄、Claude 套件 `settings.json` 預設值、Claude 套件 LSP 預設值，以及受支援的 hook packs。

每個原生 OpenClaw Plugin **都必須**在 **Plugin 根目錄**中提供 `openclaw.plugin.json` 檔案。OpenClaw 會使用此 manifest 來**在不執行 Plugin 程式碼的情況下**驗證設定。缺少或無效的 manifest 會被視為 Plugin 錯誤，並阻止設定驗證。

請參閱完整的 Plugin 系統指南：[Plugins](/zh-TW/tools/plugin)。
如需原生能力模型與目前的外部相容性指引：
[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 此檔案的用途

`openclaw.plugin.json` 是 OpenClaw **在載入你的 Plugin 程式碼之前**讀取的中繼資料。以下所有內容都必須足夠輕量，可在不啟動 Plugin 執行階段的情況下檢查。

**用於：**

- Plugin 身分、設定驗證與設定 UI 提示
- 驗證、入門導覽與設定中繼資料（別名、自動啟用、provider 環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型系列擁有權簡寫
- 靜態能力擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併到目錄與驗證介面的 channel 專屬設定中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼進入點，或 npm 安裝中繼資料。這些應放在你的 Plugin 程式碼與 `package.json` 中。

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

| 欄位                                 | 必填 | 類型                             | 含義                                                                                                                                                                                                                              |
| ------------------------------------ | ---- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 標準 Plugin id。這是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                       |
| `configSchema`                       | 是   | `object`                         | 此 Plugin 設定的內嵌 JSON Schema。                                                                                                                                                                                               |
| `enabledByDefault`                   | 否   | `true`                           | 將內建 Plugin 標記為預設啟用。省略它，或設定任何非 `true` 值，即可讓 Plugin 預設保持停用。                                                                                                                                       |
| `legacyPluginIds`                    | 否   | `string[]`                       | 會正規化為此標準 Plugin id 的舊版 id。                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 當驗證、設定或模型參照提到這些提供者 id 時，應自動啟用此 Plugin。                                                                                                                                                                |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 宣告由 `plugins.slots.*` 使用的互斥 Plugin 種類。                                                                                                                                                                                 |
| `channels`                           | 否   | `string[]`                       | 此 Plugin 擁有的頻道 id。用於探索和設定驗證。                                                                                                                                                                                    |
| `providers`                          | 否   | `string[]`                       | 此 Plugin 擁有的提供者 id。                                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | 否   | `string`                         | 輕量的提供者探索模組路徑，相對於 Plugin 根目錄，用於可在不啟用完整 Plugin 執行階段的情況下載入的、以 manifest 為範圍的提供者目錄中繼資料。                                                                                      |
| `modelSupport`                       | 否   | `object`                         | manifest 擁有的模型家族中繼資料簡寫，用於在執行階段前自動載入 Plugin。                                                                                                                                                          |
| `modelCatalog`                       | 否   | `object`                         | 此 Plugin 擁有的提供者之宣告式模型目錄中繼資料。這是未來唯讀清單、onboarding、模型選擇器、別名和抑制功能的控制平面合約，無需載入 Plugin 執行階段。                                                                              |
| `modelPricing`                       | 否   | `object`                         | 提供者擁有的外部定價查詢政策。可用來讓本機/自架提供者退出遠端定價目錄，或將提供者參照對應到 OpenRouter/LiteLLM 目錄 id，而不必在核心中硬編碼提供者 id。                                                                         |
| `modelIdNormalization`               | 否   | `object`                         | 提供者擁有的模型 id 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                                             |
| `providerEndpoints`                  | 否   | `object[]`                       | manifest 擁有的端點主機/baseUrl 中繼資料，用於核心必須在提供者執行階段載入前分類的提供者路由。                                                                                                                                  |
| `providerRequest`                    | 否   | `object`                         | 泛用請求政策在提供者執行階段載入前使用的低成本提供者家族與請求相容性中繼資料。                                                                                                                                                  |
| `cliBackends`                        | 否   | `string[]`                       | 此 Plugin 擁有的 CLI 推論後端 id。用於從明確設定參照進行啟動自動啟用。                                                                                                                                                          |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 提供者或 CLI 後端參照，其 Plugin 擁有的合成驗證 hook 應在執行階段載入前的冷模型探索期間被探測。                                                                                                                                 |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 內建 Plugin 擁有的預留位置 API 金鑰值，代表非秘密的本機、OAuth 或環境憑證狀態。                                                                                                                                                 |
| `commandAliases`                     | 否   | `object[]`                       | 此 Plugin 擁有的命令名稱，應在執行階段載入前產生具 Plugin 感知能力的設定與 CLI 診斷。                                                                                                                                            |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 已棄用的相容性 env 中繼資料，用於提供者驗證/狀態查詢。新 Plugin 請優先使用 `setup.providers[].envVars`；OpenClaw 在棄用期間仍會讀取此項。                                                                                       |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 應重用另一個提供者 id 進行驗證查詢的提供者 id，例如共用基礎提供者 API 金鑰和驗證設定檔的程式碼提供者。                                                                                                                          |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 可在不載入 Plugin 程式碼的情況下檢查的低成本頻道 env 中繼資料。用於泛用啟動/設定輔助工具應看見的 env 驅動頻道設定或驗證表面。                                                                                          |
| `providerAuthChoices`                | 否   | `object[]`                       | onboarding 選擇器、偏好提供者解析和簡單 CLI 旗標接線所用的低成本驗證選項中繼資料。                                                                                                                                              |
| `activation`                         | 否   | `object`                         | 用於啟動、提供者、命令、頻道、路由和能力觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由 Plugin 執行階段擁有。                                                                                                   |
| `setup`                              | 否   | `object`                         | 低成本設定/onboarding 描述器，供探索和設定表面在不載入 Plugin 執行階段的情況下檢查。                                                                                                                                            |
| `qaRunners`                          | 否   | `object[]`                       | 共用 `openclaw qa` 主機在 Plugin 執行階段載入前使用的低成本 QA runner 描述器。                                                                                                                                                   |
| `contracts`                          | 否   | `object`                         | 外部驗證 hook、語音、即時轉錄、即時語音、媒體理解、影像生成、音樂生成、影片生成、網頁擷取、網頁搜尋和工具所有權的靜態內建能力快照。                                                                                             |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 在 `contracts.mediaUnderstandingProviders` 中宣告的提供者 id 之低成本媒體理解預設值。                                                                                                                                            |
| `channelConfigs`                     | 否   | `Record<string, object>`         | manifest 擁有的頻道設定中繼資料，會在執行階段載入前合併到探索與驗證表面。                                                                                                                                                       |
| `skills`                             | 否   | `string[]`                       | 要載入的 Skill 目錄，相對於 Plugin 根目錄。                                                                                                                                                                                      |
| `name`                               | 否   | `string`                         | 人類可讀的 Plugin 名稱。                                                                                                                                                                                                         |
| `description`                        | 否   | `string`                         | 顯示在 Plugin 表面中的簡短摘要。                                                                                                                                                                                                 |
| `version`                            | 否   | `string`                         | 資訊性的 Plugin 版本。                                                                                                                                                                                                           |
| `uiHints`                            | 否   | `Record<string, object>`         | 設定欄位的 UI 標籤、預留位置和敏感性提示。                                                                                                                                                                                       |

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目都描述一個 onboarding 或驗證選項。
OpenClaw 會在提供者執行階段載入前讀取此內容。
提供者設定清單會使用這些 manifest 選項、由描述器衍生的設定
選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填     | 類型                                            | 含義                                                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                        | 此選項所屬的 Provider id。                                                                                                      |
| `method`              | 是       | `string`                                        | 要分派到的驗證方法 id。                                                                                                         |
| `choiceId`            | 是       | `string`                                        | onboarding 和 CLI 流程使用的穩定驗證選項 id。                                                                                   |
| `choiceLabel`         | 否       | `string`                                        | 顯示給使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                                                    |
| `choiceHint`          | 否       | `string`                                        | 選擇器的簡短輔助文字。                                                                                                          |
| `assistantPriority`   | 否       | `number`                                        | 在由 assistant 驅動的互動式選擇器中，數值較低者排序較前。                                                                       |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                  | 從 assistant 選擇器隱藏此選項，同時仍允許手動 CLI 選擇。                                                                        |
| `deprecatedChoiceIds` | 否       | `string[]`                                      | 應將使用者重新導向到此替代選項的舊版選項 id。                                                                                   |
| `groupId`             | 否       | `string`                                        | 用於將相關選項分組的選用群組 id。                                                                                               |
| `groupLabel`          | 否       | `string`                                        | 該群組顯示給使用者的標籤。                                                                                                      |
| `groupHint`           | 否       | `string`                                        | 群組的簡短輔助文字。                                                                                                            |
| `optionKey`           | 否       | `string`                                        | 簡單單一旗標驗證流程的內部選項鍵。                                                                                              |
| `cliFlag`             | 否       | `string`                                        | CLI 旗標名稱，例如 `--openrouter-api-key`。                                                                                     |
| `cliOption`           | 否       | `string`                                        | 完整 CLI 選項形式，例如 `--openrouter-api-key <key>`。                                                                          |
| `cliDescription`      | 否       | `string`                                        | CLI 說明中使用的描述。                                                                                                          |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation">` | 此選項應出現在哪些 onboarding 介面。若省略，預設為 `["text-inference"]`。                                                       |

## commandAliases 參考

當某個 Plugin 擁有使用者可能誤放進 `plugins.allow`，或嘗試作為根 CLI 命令執行的執行階段命令名稱時，請使用 `commandAliases`。OpenClaw 會使用此中繼資料進行診斷，而不匯入 Plugin 執行階段程式碼。

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
| `name`       | 是       | `string`          | 屬於此 Plugin 的命令名稱。                                              |
| `kind`       | 否       | `"runtime-slash"` | 將別名標示為聊天斜線命令，而不是根 CLI 命令。                           |
| `cliCommand` | 否       | `string`          | 若存在，建議用於 CLI 操作的相關根 CLI 命令。                            |

## activation 參考

當 Plugin 能以低成本宣告哪些控制平面事件應將它納入啟用/載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為，不會取代 `register(...)`，也不保證 Plugin 程式碼已經執行。啟用規劃器會使用這些欄位，在退回使用現有 manifest 所有權中繼資料之前縮小候選 Plugin 範圍，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

優先使用已描述所有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、setup 描述元或 `contracts` 能表達關係時，請使用那些欄位。將 `activation` 用於無法由這些所有權欄位表示的額外規劃器提示。
對於 CLI 執行階段別名，例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`，請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅適用於尚無所有權欄位的內嵌 agent harness id。

此區塊僅為中繼資料。它不會註冊執行階段行為，也不會取代 `register(...)`、`setupEntry` 或其他執行階段/Plugin 進入點。目前的消費者會在更廣泛載入 Plugin 前，將其作為縮小範圍的提示，因此缺少非啟動啟用中繼資料通常只會影響效能；只要 manifest 所有權後備機制仍存在，就不應改變正確性。

每個 Plugin 都應有意識地設定 `activation.onStartup`。只有當 Plugin 必須在 Gateway 啟動期間執行時，才將它設為 `true`。當 Plugin 在啟動時為非作用中，且應僅從更窄的觸發條件載入時，請將它設為 `false`。省略 `onStartup` 不再會隱含地在啟動時載入 Plugin；請針對啟動、channel、設定、agent-harness、memory 或其他更窄的啟用觸發條件使用明確的啟用中繼資料。

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

| 欄位               | 必填     | 類型                                                 | 含義                                                                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否       | `boolean`                                            | 明確的 Gateway 啟動啟用。每個 Plugin 都應設定此欄位。`true` 會在啟動期間匯入 Plugin；`false` 會讓它保持啟動延遲載入，除非另一個相符觸發條件需要載入。                                     |
| `onProviders`      | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的 Provider id。                                                                                                                                             |
| `onAgentHarnesses` | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的內嵌 agent harness 執行階段 id。CLI 後端別名請使用頂層 `cliBackends`。                                                                                    |
| `onCommands`       | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的命令 id。                                                                                                                                                  |
| `onChannels`       | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的 Channel id。                                                                                                                                              |
| `onRoutes`         | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的 Route kind。                                                                                                                                              |
| `onConfigPaths`    | 否       | `string[]`                                           | 當路徑存在且未被明確停用時，應將此 Plugin 納入啟動/載入計畫的根相對設定路徑。                                                                                                                |
| `onCapabilities`   | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時請優先使用更窄的欄位。                                                                                                                            |

目前的即時消費者：

- Gateway 啟動規劃會使用 `activation.onStartup` 進行明確的啟動匯入
- 命令觸發的 CLI 規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- agent-runtime 啟動規劃會對內嵌 harness 使用 `activation.onAgentHarnesses`，並對 CLI 執行階段別名使用頂層 `cliBackends[]`
- channel 觸發的 setup/channel 規劃會在缺少明確 channel 啟用中繼資料時，退回使用舊版 `channels[]` 所有權
- 啟動 Plugin 規劃會對非 channel 根設定介面使用 `activation.onConfigPaths`，例如內建 browser Plugin 的 `browser` 區塊
- Provider 觸發的 setup/runtime 規劃會在缺少明確 Provider 啟用中繼資料時，退回使用舊版 `providers[]` 和頂層 `cliBackends[]` 所有權

規劃器診斷可以區分明確啟用提示與 manifest 所有權後備。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 所有權。這些原因標籤用於主機診斷和測試；Plugin 作者應持續宣告最能描述所有權的中繼資料。

## qaRunners 參考

當某個 Plugin 在共用的 `openclaw qa` 根命令之下貢獻一個或多個傳輸 runner 時，請使用 `qaRunners`。保持此中繼資料低成本且靜態；Plugin 執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際 CLI 註冊，該介面會匯出 `qaRunnerCliRegistrations`。

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

| 欄位          | 必填     | 類型     | 含義                                                               |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是       | `string` | 掛載於 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否       | `string` | 當共用主機需要 stub 命令時使用的後備說明文字。                     |

## setup 參考

當 setup 和 onboarding 介面需要在執行階段載入前取得低成本且由 Plugin 擁有的中繼資料時，請使用 `setup`。

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

頂層 `cliBackends` 仍然有效，並持續描述 CLI 推論後端。`setup.cliBackends` 是控制平面/設定流程專用的設定描述子介面，應維持僅含中繼資料。

存在時，`setup.providers` 和 `setup.cliBackends` 是設定探索偏好的描述子優先查詢介面。如果描述子只縮小候選 Plugin 範圍，而設定仍需要更完整的設定期間執行階段掛鉤，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為後備執行路徑。

OpenClaw 也會在通用提供者驗證和環境變數查詢中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在棄用期間仍透過相容性轉接器支援，但仍使用它的非內建 Plugin 會收到資訊清單診斷。新的 Plugin 應將設定/狀態環境中繼資料放在 `setup.providers[].envVars`。

當沒有設定項目可用，或 `setup.requiresRuntime: false` 宣告不需要設定執行階段時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的設定選項。明確的 `providerAuthChoices` 項目仍是自訂標籤、CLI 旗標、上線範圍和助理中繼資料的偏好方式。

只有在這些描述子足以支援設定介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述子的合約，並且不會為設定查詢執行 `setup-api` 或 `openclaw.setupEntry`。如果僅描述子的 Plugin 仍隨附其中一個設定執行階段項目，OpenClaw 會回報加成診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版後備行為，因此已新增描述子但未新增該旗標的既有 Plugin 不會中斷。

由於設定查詢可以執行 Plugin 擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必須在已探索到的 Plugin 間保持唯一。所有權不明確時會封閉失敗，而不是依探索順序挑選勝出者。

設定執行階段執行時，如果 `setup-api` 註冊了資訊清單描述子未宣告的提供者或 CLI 後端，或描述子沒有對應的執行階段註冊，設定登錄診斷會回報描述子偏移。這些診斷是加成的，不會拒絕舊版 Plugin。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 意義                                                                                             |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | 設定或上線期間公開的提供者 id。請讓正規化後的 id 在全域保持唯一。                               |
| `authMethods`  | 否   | `string[]` | 此提供者支援且不需載入完整執行階段的設定/驗證方法 id。                                          |
| `envVars`      | 否   | `string[]` | 通用設定/狀態介面可在 Plugin 執行階段載入前檢查的環境變數。                                     |
| `authEvidence` | 否   | `object[]` | 針對可透過非機密標記驗證的提供者，進行低成本本機驗證證據檢查。                                  |

`authEvidence` 用於提供者擁有、可在不載入執行階段程式碼的情況下驗證的本機憑證標記。這些檢查必須維持低成本且本機：不得進行網路呼叫、不得讀取鑰匙圈或祕密管理器、不得執行 shell 命令，也不得探測提供者 API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 意義                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                            |
| `fileEnvVar`       | 否   | `string`   | 包含明確憑證檔案路徑的環境變數。                                                                          |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 和 `${APPDATA}`。                    |
| `requiresAnyEnv`   | 否   | `string[]` | 在證據有效之前，列出的環境變數中至少一個必須非空。                                                        |
| `requiresAllEnv`   | 否   | `string[]` | 在證據有效之前，列出的每個環境變數都必須非空。                                                            |
| `credentialMarker` | 是   | `string`   | 證據存在時傳回的非機密標記。                                                                              |
| `source`           | 否   | `string`   | 驗證/狀態輸出的使用者可見來源標籤。                                                                       |

### setup 欄位

| 欄位               | 必填 | 類型       | 意義                                                                                             |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | 否   | `object[]` | 設定和上線期間公開的提供者設定描述子。                                                           |
| `cliBackends`      | 否   | `string[]` | 用於描述子優先設定查詢的設定期間後端 id。請讓正規化後的 id 在全域保持唯一。                     |
| `configMigrations` | 否   | `string[]` | 由此 Plugin 設定介面擁有的設定遷移 id。                                                          |
| `requiresRuntime`  | 否   | `boolean`  | 描述子查詢後，設定是否仍需要執行 `setup-api`。                                                    |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型算繪提示的對照表。

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

| 欄位          | 類型       | 意義                       |
| ------------- | ---------- | -------------------------- |
| `label`       | `string`   | 使用者可見的欄位標籤。     |
| `help`        | `string`   | 簡短的輔助說明文字。       |
| `tags`        | `string[]` | 選用的 UI 標籤。           |
| `advanced`    | `boolean`  | 將欄位標記為進階。         |
| `sensitive`   | `boolean`  | 將欄位標記為機密或敏感。   |
| `placeholder` | `string`   | 表單輸入的預留位置文字。   |

## contracts 參考

只有在 OpenClaw 可不匯入 Plugin 執行階段就讀取的靜態能力所有權中繼資料中，才使用 `contracts`。

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
| `embeddedExtensionFactories`     | `string[]` | Codex 應用程式伺服器 extension factory id，目前為 `codex-app-server`。 |
| `agentToolResultMiddleware`      | `string[]` | 內建 Plugin 可為其註冊工具結果中介軟體的執行階段 id。                 |
| `externalAuthProviders`          | `string[]` | 此 Plugin 擁有其外部驗證設定檔掛鉤的提供者 id。                       |
| `speechProviders`                | `string[]` | 此 Plugin 擁有的語音提供者 id。                                       |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 擁有的即時轉錄提供者 id。                                   |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 擁有的即時語音提供者 id。                                   |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 擁有的記憶體嵌入提供者 id。                                 |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 擁有的媒體理解提供者 id。                                   |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 擁有的影像生成提供者 id。                                   |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 擁有的影片生成提供者 id。                                   |
| `webFetchProviders`              | `string[]` | 此 Plugin 擁有的 Web 擷取提供者 id。                                  |
| `webSearchProviders`             | `string[]` | 此 Plugin 擁有的 Web 搜尋提供者 id。                                  |
| `migrationProviders`             | `string[]` | 此 Plugin 針對 `openclaw migrate` 擁有的匯入提供者 id。                |
| `tools`                          | `string[]` | 此 Plugin 針對內建合約檢查擁有的代理工具名稱。                        |

`contracts.embeddedExtensionFactories` 保留給內建 Codex 僅限應用程式伺服器的 extension factory。內建工具結果轉換應改為宣告 `contracts.agentToolResultMiddleware`，並使用 `api.registerAgentToolResultMiddleware(...)` 註冊。外部 Plugin 無法註冊工具結果中介軟體，因為該接縫可在模型看到高信任度工具輸出前重寫它。

實作 `resolveExternalAuthProfiles` 的提供者 Plugin 應宣告 `contracts.externalAuthProviders`。沒有宣告的 Plugin 仍會透過已棄用的相容性後備執行，但該後備較慢，並會在遷移期間結束後移除。

內建記憶體嵌入提供者應為其公開的每個轉接器 id 宣告 `contracts.memoryEmbeddingProviders`，包括 `local` 等內建轉接器。獨立 CLI 路徑會使用此資訊清單合約，在完整 Gateway 執行階段註冊提供者之前，只載入擁有者 Plugin。

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動驗證後備優先順序，或通用核心輔助程式在執行階段載入前需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須在 `contracts.mediaUnderstandingProviders` 中宣告。

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

每個提供者項目可包含：

| 欄位                   | 類型                                | 含義                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供者公開的媒體能力。                                                     |
| `defaultModels`        | `Record<string, string>`            | 當設定未指定模型時使用的能力對模型預設值。                                   |
| `autoPriority`         | `Record<string, number>`            | 數字越低，在基於憑證的自動提供者備援中排序越前。                             |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供者支援的原生文件輸入。                                                   |

## channelConfigs 參考

當通道 Plugin 需要在執行階段載入前取得低成本設定中繼資料時，請使用 `channelConfigs`。唯讀的通道設定/狀態探索可以直接使用這些中繼資料來處理已設定的外部通道，前提是沒有可用的設定項目，或 `setup.requiresRuntime: false` 宣告設定不需要執行階段。

`channelConfigs` 是 Plugin manifest 中繼資料，不是新的頂層使用者設定區段。使用者仍然在 `channels.<channel-id>` 下設定通道實例。OpenClaw 會讀取 manifest 中繼資料，以便在 Plugin 執行階段程式碼執行前，判斷哪個 Plugin 擁有該已設定通道。

對於通道 Plugin，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非內建 Plugin 也應宣告相符的 `channelConfigs` 項目。若沒有這些項目，OpenClaw 仍可載入該 Plugin，但冷路徑設定 schema、設定流程和 Control UI 介面必須等到 Plugin 執行階段執行後，才知道通道擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以宣告靜態 `auto` 預設值，用於在通道執行階段載入前執行的命令設定檢查。內建通道也可以透過 `package.json#openclaw.channel.commands` 發布相同預設值，與其他套件擁有的通道目錄中繼資料並列。

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

每個通道項目可以包含：

| 欄位          | 類型                     | 含義                                                                               |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每個已宣告的通道設定項目都必須提供。              |
| `uiHints`     | `Record<string, object>` | 該通道設定區段的選用 UI 標籤/預留文字/敏感提示。                                  |
| `label`       | `string`                 | 當執行階段中繼資料尚未就緒時，合併到選擇器與檢查介面的通道標籤。                 |
| `description` | `string`                 | 用於檢查與目錄介面的簡短通道描述。                                                 |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。                   |
| `preferOver`  | `string[]`               | 此通道在選擇介面中應優先於其上的舊版或較低優先序 Plugin id。                      |

### 取代另一個通道 Plugin

當你的 Plugin 是某個通道 id 的偏好擁有者，而另一個 Plugin 也能提供該通道時，請使用 `preferOver`。常見情況包括重新命名的 Plugin id、取代內建 Plugin 的獨立 Plugin，或為了設定相容性而保留相同通道 id 的維護中分支。

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

設定 `channels.chat` 時，OpenClaw 會同時考量通道 id 與偏好的 Plugin id。如果較低優先序的 Plugin 只是因為它是內建或預設啟用而被選取，OpenClaw 會在有效執行階段設定中停用它，讓單一 Plugin 擁有該通道及其工具。明確的使用者選擇仍然優先：如果使用者明確啟用兩個 Plugin，OpenClaw 會保留該選擇，並回報重複通道/工具診斷，而不是默默變更要求的 Plugin 集合。

請將 `preferOver` 限定在確實能提供相同通道的 Plugin id。它不是一般優先序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在 Plugin 執行階段載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6` 這類簡寫模型 id 推斷你的提供者 Plugin 時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 套用以下優先順序：

- 明確的 `provider/model` 參照會使用擁有方的 `providers` manifest 中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 如果一個非內建 Plugin 和一個內建 Plugin 都符合，非內建 Plugin 勝出
- 其餘歧義會被忽略，直到使用者或設定指定提供者

欄位：

| 欄位            | 類型       | 含義                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 與簡寫模型 id 比對的前綴。                                    |
| `modelPatterns` | `string[]` | 在移除 profile 後綴後，與簡寫模型 id 比對的 Regex 來源。                        |

## modelCatalog 參考

當 OpenClaw 應在載入 Plugin 執行階段前知道提供者模型中繼資料時，請使用 `modelCatalog`。這是 manifest 擁有的來源，用於固定目錄列、提供者別名、抑制規則與探索模式。執行階段重新整理仍由提供者執行階段程式碼負責，但 manifest 會告訴核心何時需要執行階段。

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

| 欄位           | 類型                                                     | 含義                                                                                                       |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此 Plugin 擁有的提供者 id 的目錄列。鍵也應出現在頂層 `providers` 中。                                      |
| `aliases`      | `Record<string, object>`                                 | 應解析為所擁有提供者的提供者別名，用於目錄或抑制規劃。                                                     |
| `suppressions` | `object[]`                                               | 此 Plugin 基於提供者特定原因，從其他來源抑制的模型列。                                                     |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄是否可從 manifest 中繼資料讀取、重新整理到快取，或需要執行階段。                                |

`aliases` 會參與模型目錄規劃的提供者擁有權查詢。別名目標必須是同一 Plugin 擁有的頂層提供者。當以提供者篩選的清單使用別名時，OpenClaw 可以讀取擁有方 manifest，並在不載入提供者執行階段的情況下套用別名 API/基底 URL 覆寫。別名不會展開未篩選的目錄清單；廣泛清單只會發出擁有方的正式提供者列。

`suppressions` 會取代舊的提供者執行階段 `suppressBuiltInModel` hook。只有當提供者由該 Plugin 擁有，或宣告為 `modelCatalog.aliases` 鍵且目標是所擁有的提供者時，抑制項目才會生效。模型解析期間不再呼叫執行階段抑制 hook。

提供者欄位：

| 欄位      | 類型                     | 含義                                                        |
| --------- | ------------------------ | ----------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供者目錄中模型的選用預設基底 URL。                     |
| `api`     | `ModelApi`               | 此提供者目錄中模型的選用預設 API adapter。                  |
| `headers` | `Record<string, string>` | 套用到此提供者目錄的選用靜態標頭。                         |
| `models`  | `object[]`               | 必填模型列。沒有 `id` 的列會被忽略。                        |

模型欄位：

| 欄位           | 類型                                                           | 意義                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 供應商本機模型 id，不含 `provider/` 前綴。                    |
| `name`          | `string`                                                       | 選用的顯示名稱。                                                      |
| `api`           | `ModelApi`                                                     | 選用的個別模型 API 覆寫。                                            |
| `baseUrl`       | `string`                                                       | 選用的個別模型基底 URL 覆寫。                                       |
| `headers`       | `Record<string, string>`                                       | 選用的個別模型靜態標頭。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                               |
| `reasoning`     | `boolean`                                                      | 模型是否公開推理行為。                               |
| `contextWindow` | `number`                                                       | 原生供應商脈絡視窗。                                             |
| `contextTokens` | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段脈絡上限。 |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出 token 數。                                           |
| `cost`          | `object`                                                       | 選用的每百萬 token 美元定價，包括選用的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 選用的相容性旗標，對應 OpenClaw 模型設定相容性。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有當該列完全不應出現時才抑制。          |
| `statusReason`  | `string`                                                       | 選用原因，會與非可用狀態一起顯示。                            |
| `replaces`      | `string[]`                                                     | 此模型取代的較舊供應商本機模型 id。                       |
| `replacedBy`    | `string`                                                       | 已棄用列的替代供應商本機模型 id。                    |
| `tags`          | `string[]`                                                     | 選擇器和篩選器使用的穩定標籤。                                    |

抑制欄位：

| 欄位                      | 類型       | 意義                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列供應商 id。必須由此 Plugin 擁有，或宣告為已擁有的別名。 |
| `model`                    | `string`   | 要抑制的供應商本機模型 id。                                                                      |
| `reason`                   | `string`   | 當被抑制的列被直接請求時顯示的選用訊息。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的選用有效供應商基底 URL 主機清單。               |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確供應商設定 `api` 值選用清單。              |

不要把僅限執行階段的資料放入 `modelCatalog`。只有在資訊清單
列已足夠完整，能讓依供應商篩選的列表和選擇器介面略過
登錄檔／執行階段探索時，才使用 `static`。當資訊清單列是有用且
可列出的種子或補充項目，但稍後重新整理／快取可以加入更多列時，使用 `refreshable`；
refreshable 列本身不具權威性。當 OpenClaw
必須載入供應商執行階段才能知道列表時，使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、由供應商擁有的模型 id 清理，且必須
在供應商執行階段載入前發生。這會把短模型
名稱、供應商本機舊版 id，以及代理前綴規則等別名保留在擁有方 Plugin
資訊清單中，而不是放在核心模型選擇表內。

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

| 欄位                                | 類型                    | 意義                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不分大小寫的精確模型 id 別名。值會依原樣傳回。                  |
| `stripPrefixes`                      | `string[]`              | 在別名查找前移除的前綴，適用於舊版 provider/model 重複。     |
| `prefixWhenBare`                     | `string`                | 當標準化後的模型 id 尚未包含 `/` 時加入的前綴。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查找後的條件式裸 id 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。 |

## providerEndpoints 參考

使用 `providerEndpoints` 進行端點分類，供一般請求原則
在供應商執行階段載入前掌握。核心仍擁有每個
`endpointClass` 的含義；Plugin 資訊清單擁有主機與基底 URL 中繼資料。

端點欄位：

| 欄位                          | 類型       | 意義                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 對應到端點類別的精確主機名稱。                                                |
| `hostSuffixes`                 | `string[]` | 對應到端點類別的主機後綴。以 `.` 開頭表示僅比對網域後綴。 |
| `baseUrls`                     | `string[]` | 對應到端點類別的精確標準化 HTTP(S) 基底 URL。                             |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的後綴，用來公開 Google Vertex 區域前綴。                 |

## providerRequest 參考

使用 `providerRequest` 提供低成本請求相容性中繼資料，讓一般
請求原則不需載入供應商執行階段即可使用。將行為特定的
承載重寫保留在供應商執行階段 hook 或共享的供應商系列輔助工具中。

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

供應商欄位：

| 欄位                 | 類型         | 意義                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 一般請求相容性決策與診斷使用的供應商系列標籤。 |
| `compatibilityFamily` | `"moonshot"` | 共享請求輔助工具的選用供應商系列相容性分組。              |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。       |

## modelPricing 參考

當供應商需要在執行階段載入前提供控制平面定價行為時，
使用 `modelPricing`。Gateway 定價快取會讀取此中繼資料，而不匯入
供應商執行階段程式碼。

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
| `external`   | `boolean`         | 對於本機／自架供應商設為 `false`，使其永遠不擷取 OpenRouter 或 LiteLLM 定價。 |
| `openRouter` | `false \| object` | OpenRouter 定價查找對應。`false` 會停用此供應商的 OpenRouter 查找。           |
| `liteLLM`    | `false \| object` | LiteLLM 定價查找對應。`false` 會停用此供應商的 LiteLLM 查找。                 |

來源欄位：

| 欄位                      | 類型               | 意義                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄供應商 id 不同於 OpenClaw 供應商 id 時使用，例如 `zai` 供應商的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 id 視為巢狀 provider/model 參照，適用於 OpenRouter 等代理供應商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 id 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的點號版本 id。            |

### OpenClaw 供應商索引

OpenClaw 供應商索引是 OpenClaw 擁有的供應商預覽中繼資料，
適用於其 Plugin 可能尚未安裝的供應商。它不是 Plugin 資訊清單的一部分。
Plugin 資訊清單仍是已安裝 Plugin 的權威來源。供應商索引是
未來可安裝供應商與安裝前模型選擇器介面在供應商 Plugin 未安裝時
會使用的內部後援合約。

目錄權威順序：

1. 使用者設定。
2. 已安裝 Plugin 資訊清單 `modelCatalog`。
3. 來自明確重新整理的模型目錄快取。
4. OpenClaw 供應商索引預覽列。

提供者索引不得包含祕密、啟用狀態、執行階段掛鉤，或
即時帳戶專屬模型資料。其預覽目錄使用與 Plugin 清單相同的
`modelCatalog` 提供者列形狀，但應限於穩定的顯示中繼資料，除非
`api`、`baseUrl`、定價或相容性旗標等執行階段配接器欄位，是刻意與
已安裝的 Plugin 清單保持一致。具備即時 `/models` 探索的提供者，應
透過明確的模型目錄快取路徑寫入重新整理後的列，而不是讓一般列表或初始設定呼叫提供者 API。

提供者索引項目也可以攜帶可安裝 Plugin 中繼資料，用於其 Plugin 已移出核心或尚未安裝的提供者。
此中繼資料沿用通道目錄模式：套件名稱、npm 安裝規格、
預期完整性，以及輕量的驗證選項標籤，就足以顯示可安裝的設定選項。
一旦 Plugin 已安裝，其清單優先，而該提供者的提供者索引項目會被忽略。

舊版頂層能力鍵已棄用。使用 `openclaw doctor --fix` 將
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移至 `contracts` 底下；一般
清單載入不再將這些頂層欄位視為能力擁有權。

## 清單與 package.json

這兩個檔案負責不同工作：

| 檔案                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選項中繼資料，以及必須在 Plugin 程式碼執行前存在的 UI 提示                         |
| `package.json`         | npm 中繼資料、相依項安裝，以及用於進入點、安裝門檻、設定或目錄中繼資料的 `openclaw` 區塊 |

如果你不確定某段中繼資料應該放在哪裡，請使用這條規則：

- 如果 OpenClaw 必須在載入 Plugin 程式碼前知道它，請放在 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放在 `package.json`

### 影響探索的 package.json 欄位

部分執行階段前的 Plugin 中繼資料，刻意放在 `package.json` 的
`openclaw` 區塊下，而不是 `openclaw.plugin.json`。

重要範例：

| 欄位                                                             | 含義                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 宣告原生 Plugin 進入點。必須保留在 Plugin 套件目錄內。                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 宣告已安裝套件的已建置 JavaScript 執行階段進入點。必須保留在 Plugin 套件目錄內。                                                                 |
| `openclaw.setupEntry`                                             | 初始設定、延後的通道啟動，以及唯讀通道狀態/SecretRef 探索期間使用的輕量僅設定進入點。必須保留在 Plugin 套件目錄內。 |
| `openclaw.runtimeSetupEntry`                                      | 宣告已安裝套件的已建置 JavaScript 設定進入點。需要 `setupEntry`，必須存在，且必須保留在 Plugin 套件目錄內。                         |
| `openclaw.channel`                                                | 輕量通道目錄中繼資料，例如標籤、文件路徑、別名與選擇文案。                                                                                                 |
| `openclaw.channel.commands`                                       | 在通道執行階段載入前，由設定、稽核與指令列表介面使用的靜態原生指令與原生 Skills 自動預設中繼資料。                                          |
| `openclaw.channel.configuredState`                                | 輕量已設定狀態檢查器中繼資料，可以在不載入完整通道執行階段的情況下回答「是否已存在僅環境變數設定？」。                                         |
| `openclaw.channel.persistedAuthState`                             | 輕量持久化驗證檢查器中繼資料，可以在不載入完整通道執行階段的情況下回答「是否已有任何登入狀態？」。                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 提供給內建與外部發布 Plugin 的安裝/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 當多個安裝來源可用時的偏好安裝路徑。                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | 支援的最低 OpenClaw 主機版本，使用像 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 這樣的 semver 下限。                                                                             |
| `openclaw.install.expectedIntegrity`                              | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝與更新流程會用它驗證擷取到的成品。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | 當設定無效時，允許一條狹窄的內建 Plugin 重新安裝復原路徑。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 讓僅設定通道介面在啟動期間先於完整通道 Plugin 載入。                                                                                                 |

清單中繼資料決定在執行階段載入前，哪些提供者/通道/設定選項會出現在
初始設定中。`package.json#openclaw.install` 告訴
初始設定，當使用者選取其中一個選項時要如何擷取或啟用該 Plugin。
不要將安裝提示移到 `openclaw.plugin.json`。

對非內建 Plugin 來源而言，`openclaw.install.minHostVersion` 會在安裝與清單
登錄載入期間強制執行。無效值會被拒絕；
較新但有效的值會在較舊主機上略過外部 Plugin。內建來源
Plugin 會假定與主機 checkout 共同版本化。

精確的 npm 版本釘選已存在於 `npmSpec`，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄
項目應將精確規格搭配 `expectedIntegrity`，讓更新流程在擷取到的 npm 成品
不再符合釘選發行版時失敗關閉。
為了相容性，互動式初始設定仍會提供受信任登錄的 npm 規格，包括裸
套件名稱與 dist-tags。目錄診斷可以區分
精確、浮動、完整性釘選、缺少完整性、套件名稱
不符，以及無效的預設選項來源。它們也會在
`expectedIntegrity` 存在但沒有可釘選的有效 npm 來源時發出警告。
當 `expectedIntegrity` 存在時，
安裝/更新流程會強制執行；當它省略時，登錄解析會在沒有完整性釘選的情況下被記錄。

當狀態、通道列表或 SecretRef 掃描需要在不載入完整
執行階段的情況下識別已設定帳戶時，通道 Plugin 應提供 `openclaw.setupEntry`。
設定進入點應公開通道中繼資料，以及設定安全的設定、
狀態與祕密配接器；將網路用戶端、Gateway 監聽器與
傳輸執行階段保留在主要 extension 進入點中。

執行階段進入點欄位不會覆寫來源
進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓
逸出邊界的 `openclaw.extensions` 路徑變得可載入。

`openclaw.install.allowInvalidConfigRecovery` 刻意保持狹窄。它不會
讓任意損壞的設定變得可安裝。如今它只允許安裝
流程從特定過期內建 Plugin 升級失敗中復原，例如
缺少內建 Plugin 路徑，或同一個
內建 Plugin 的過期 `channels.<id>` 項目。無關的設定錯誤仍會阻擋安裝，並將操作員
導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一個微型檢查器
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

當設定、doctor、狀態或唯讀存在性流程需要在完整通道 Plugin 載入前進行輕量
是/否驗證探測時使用它。持久化驗證狀態不是
已設定通道狀態：不要使用此中繼資料自動啟用 Plugin、
修復執行階段相依項，或判斷是否應載入通道執行階段。
目標匯出應是一個只讀取持久化狀態的小型函式；不要
透過完整通道執行階段 barrel 轉送它。

`openclaw.channel.configuredState` 對輕量僅環境變數
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

當通道可以從環境變數或其他微型
非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的
通道執行階段，請將該邏輯保留在 Plugin `config.hasConfiguredState`
掛鉤中。

## 探索優先順序（重複的 Plugin ID）

OpenClaw 會從多個根目錄探索 Plugin（內建、全域安裝、工作區、明確設定選取的路徑）。如果兩個探索結果共用相同的 `id`，只會保留**最高優先順序**的清單；較低優先順序的重複項目會被捨棄，而不是並列載入。

優先順序，從高到低：

1. **設定選取** — 明確釘選在 `plugins.entries.<id>` 中的路徑
2. **內建** — 隨 OpenClaw 提供的 Plugin
3. **全域安裝** — 安裝到全域 OpenClaw Plugin 根目錄中的 Plugin
4. **工作區** — 相對於目前工作區探索到的 Plugin

影響：

- 位於工作區中的內建 Plugin 分叉或過期副本，不會遮蔽內建建置。
- 若要實際以本機 Plugin 覆寫內建 Plugin，請透過 `plugins.entries.<id>` 釘選它，使其依優先順序勝出，而不是依賴工作區探索。
- 重複項目的捨棄會被記錄，讓 Doctor 與啟動診斷可以指出被丟棄的副本。

## JSON Schema 要求

- **每個 Plugin 都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空 schema 可接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段驗證。

## 驗證行為

- 未知的 `channels.*` 鍵是**錯誤**，除非該 channel id 由
  Plugin manifest 宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必須參照**可探索**的 Plugin id。未知 id 是**錯誤**。
- 如果 Plugin 已安裝，但 manifest 或 schema 損壞或遺失，
  驗證會失敗，Doctor 會回報 Plugin 錯誤。
- 如果 Plugin config 存在，但 Plugin 已**停用**，config 會保留，並且
  Doctor + 日誌中會顯示**警告**。

完整的 `plugins.*` schema 請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- manifest 是**原生 OpenClaw Plugin 的必要項目**，包括本機檔案系統載入。Runtime 仍會另行載入 Plugin 模組；manifest 只用於探索 + 驗證。
- 原生 manifest 會以 JSON5 解析，因此註解、尾隨逗號和未加引號的鍵都可接受，只要最終值仍是物件即可。
- manifest loader 只會讀取已文件化的 manifest 欄位。請避免自訂頂層鍵。
- 當 Plugin 不需要時，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必須保持輕量，不應匯入大範圍的 runtime 程式碼；請將其用於靜態 provider 目錄 metadata 或狹窄的探索描述符，而非 request-time 執行。
- 獨占 Plugin kind 透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`，`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設 `legacy`）。
- 請在此 manifest 中宣告獨占 Plugin kind。Runtime-entry `OpenClawPluginDefinition.kind` 已棄用，且僅作為舊版 Plugin 的相容 fallback 保留。
- Env-var metadata（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅為宣告式。Status、audit、Cron delivery validation 和其他 read-only surface 在將 env var 視為已設定之前，仍會套用 Plugin 信任與有效啟用政策。
- 對於需要 provider 程式碼的 runtime wizard metadata，請參閱 [Provider runtime hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的 Plugin 依賴原生模組，請記錄建置步驟和任何 package-manager allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="Building plugins" href="/zh-TW/plugins/building-plugins" icon="rocket">
    開始使用 Plugin。
  </Card>
  <Card title="Plugin architecture" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與 capability model。
  </Card>
  <Card title="SDK overview" href="/zh-TW/plugins/sdk-overview" icon="book">
    Plugin SDK 參考與 subpath imports。
  </Card>
</CardGroup>
