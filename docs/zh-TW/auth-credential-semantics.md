---
read_when:
    - 處理驗證設定檔解析或憑證路由
    - 偵錯模型驗證失敗或設定檔順序
summary: 驗證設定檔的標準憑證資格與解析語意
title: 驗證憑證語意
x-i18n:
    generated_at: "2026-07-05T11:00:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

這些語意讓選取時與執行階段的驗證行為保持一致。它們由下列項目共用：

- `resolveAuthProfileOrder`（設定檔排序）
- `resolveApiKeyForProfile`（執行階段憑證解析）
- `openclaw models status --probe`
- `openclaw doctor` 驗證檢查（`doctor-auth`）

## 穩定的探測原因代碼

探測結果會帶有 `status` 分類（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`），並在探測從未到達模型呼叫時帶有穩定的 `reasonCode`：

| `reasonCode`             | 含義                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `excluded_by_auth_order` | 設定檔已從其提供者的明確驗證順序中省略。               |
| `missing_credential`     | 未設定內嵌憑證或 SecretRef。                             |
| `expired`                | 權杖 `expires` 已過期。                                              |
| `invalid_expires`        | `expires` 不是有效的正數 Unix 毫秒時間戳記。                         |
| `unresolved_ref`         | 無法解析已設定的 SecretRef。                                  |
| `ineligible_profile`     | 設定檔與提供者設定不相容（包括格式錯誤的金鑰輸入）。 |
| `no_model`               | 憑證存在，但沒有解析出可探測的模型候選項。                 |

資格檢查會對可用憑證回報 `ok` 作為原因代碼。

## 權杖憑證

權杖憑證（`type: "token"`）支援內嵌的 `token` 和/或 `tokenRef`。

### 資格規則

1. 當 `token` 和 `tokenRef` 都不存在時，權杖設定檔不符合資格（`missing_credential`）。
2. `expires` 是選用的。若存在，它必須是大於 `0`，且不大於 JavaScript `Date` 時間戳記上限（8640000000000000）的有限 Unix epoch 毫秒數。
3. 如果 `expires` 無效（類型錯誤、`NaN`、`0`、負數、非有限值，或超過該上限），設定檔會因 `invalid_expires` 而不符合資格。
4. 如果 `expires` 在過去，設定檔會因 `expired` 而不符合資格。
5. `tokenRef` 不會略過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意與資格語意相符。
2. 對於符合資格的設定檔，權杖素材可以從內嵌值或 `tokenRef` 解析。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## 代理程式副本可攜性

代理程式驗證繼承是讀穿式的。當代理程式沒有本機設定檔時，它會在執行階段從預設/主要代理程式儲存區解析設定檔，而不會將祕密素材複製到自己的憑證儲存區（`agents/<agentId>/agent/openclaw-agent.sqlite`）。

明確的複製流程，例如 `openclaw agents add`，會使用此可攜性政策：

- `api_key` 和 `token` 設定檔可攜，除非 `copyToAgents: false`。
- `oauth` 設定檔預設不可攜，因為重新整理權杖可能是一次性使用或對輪替敏感。
- 提供者擁有的 OAuth 流程只有在已知跨代理程式複製重新整理素材安全時，才能使用 `copyToAgents: true` 選擇加入；此選擇加入僅在設定檔帶有內嵌存取/重新整理素材時適用。

不可攜的設定檔仍可透過讀穿式繼承使用，除非目標代理程式另行登入並建立自己的本機設定檔。

## 僅設定驗證路由

含有 `mode: "aws-sdk"` 的 `auth.profiles` 項目是路由中繼資料，而非已儲存的憑證。當目標提供者使用 `models.providers.<id>.auth: "aws-sdk"` 時，它們有效；這是外掛擁有的 Amazon Bedrock 設定所寫入的路由。即使憑證儲存區中沒有相符項目，這些設定檔 ID 也可能出現在 `auth.order` 和工作階段覆寫中。

不要將 `type: "aws-sdk"` 寫入憑證儲存區；已儲存的憑證只能是 `api_key`、`token` 或 `oauth`。如果舊版 `auth-profiles.json` 有這類標記，`openclaw doctor --fix` 會將它移至 `auth.profiles`，並從儲存區移除該標記。

## 明確驗證順序篩選

- 當為提供者設定 `auth.order.<provider>` 或驗證儲存區順序覆寫時，`models status --probe` 只會探測仍留在該提供者已解析驗證順序中的設定檔 ID。已儲存的覆寫優先於 `auth.order` 設定。
- 該提供者的已儲存設定檔若從明確順序中省略，之後不會被靜默嘗試。探測輸出會以 `reasonCode: excluded_by_auth_order` 和詳細資訊 `Excluded by auth.order for this provider.` 回報它。

## 探測目標解析

- 探測目標可來自驗證設定檔、環境憑證或 `models.json`（結果 `source`：`profile`、`env`、`models.json`）。
- 如果提供者有憑證，但 OpenClaw 無法為其解析出可探測的模型候選項，`models status --probe` 會以 `reasonCode: no_model` 回報 `status: no_model`。

## 外部命令列介面憑證探索

- 由外部命令列介面擁有的僅執行階段憑證（Claude CLI 對應 `claude-cli`、Codex CLI 對應 `openai`、MiniMax CLI 對應 `minimax-portal`），只會在提供者、執行階段或驗證設定檔位於目前操作範圍內時，或該外部來源已有已儲存的本機設定檔時被探索。
- 驗證儲存區呼叫端會選擇明確的外部命令列介面探索模式：`none` 表示僅限持久化/外掛驗證，`existing` 表示重新整理已儲存的外部命令列介面設定檔，或 `scoped` 表示具體的提供者/設定檔集合。
- 唯讀/狀態路徑會傳遞 `allowKeychainPrompt: false`；它們只使用檔案支援的外部命令列介面憑證，且不讀取或重用 macOS Keychain 結果。

## OAuth SecretRef 政策防護

SecretRef 輸入僅用於靜態憑證。OAuth 憑證可在執行階段變動（重新整理流程會持久化輪替後的權杖），因此 SecretRef 支援的 OAuth 素材會讓可變狀態分散到多個儲存區。

- 如果設定檔憑證是 `type: "oauth"`，該設定檔上任何憑證素材欄位都會拒絕 SecretRef 物件。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，該設定檔會拒絕 SecretRef 支援的 `keyRef`/`tokenRef` 輸入。
- 違規會在啟動/重新載入祕密準備與設定檔解析路徑中成為硬性失敗（拋出錯誤）。

## 舊版相容訊息

為了指令碼相容性，探測錯誤會保持這第一行不變：

`Auth profile credentials are missing or expired.`

便於人類閱讀的詳細資訊與穩定原因代碼會在後續行以 `↳ Auth reason [code]: ...` 形式呈現。

## 相關

- [祕密管理](/zh-TW/gateway/secrets)
- [驗證儲存](/zh-TW/concepts/oauth)
