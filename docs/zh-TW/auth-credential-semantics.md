---
read_when:
    - 處理驗證設定檔解析或憑證路由作業
    - 偵錯模型驗證失敗或設定檔順序
summary: 驗證設定檔的標準憑證適用資格與解析語意
title: 驗證憑證語意
x-i18n:
    generated_at: "2026-07-11T21:06:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

這些語意可使選取時與執行階段的驗證行為保持一致。以下項目共用這些語意：

- `resolveAuthProfileOrder`（設定檔排序）
- `resolveApiKeyForProfile`（執行階段憑證解析）
- `openclaw models status --probe`
- `openclaw doctor` 驗證檢查（`doctor-auth`）

## 穩定的探測原因代碼

探測結果包含一個 `status` 分類（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`）；若探測從未進入模型呼叫，還會包含穩定的 `reasonCode`：

| `reasonCode`             | 含義                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `excluded_by_auth_order` | 設定檔未列入其提供者的明確驗證順序。                       |
| `missing_credential`     | 未設定內嵌憑證或 SecretRef。                               |
| `expired`                | 權杖的 `expires` 已是過去時間。                            |
| `invalid_expires`        | `expires` 不是有效的正數 Unix 毫秒時間戳記。               |
| `unresolved_ref`         | 無法解析已設定的 SecretRef。                               |
| `ineligible_profile`     | 設定檔與提供者設定不相容（包括格式錯誤的金鑰輸入）。       |
| `no_model`               | 憑證存在，但未解析出可探測的候選模型。                     |

資格檢查會以 `ok` 作為可用憑證的原因代碼。

## 權杖憑證

權杖憑證（`type: "token"`）支援內嵌 `token` 和／或 `tokenRef`。

### 資格規則

1. 同時缺少 `token` 與 `tokenRef` 時，權杖設定檔不符合資格（`missing_credential`）。
2. `expires` 為選填。若存在，必須是大於 `0` 且不超過 JavaScript `Date` 最大時間戳記（8640000000000000）的有限 Unix 紀元毫秒數值。
3. 若 `expires` 無效（型別錯誤、`NaN`、`0`、負數、非有限值或超出該上限），設定檔不符合資格，原因為 `invalid_expires`。
4. 若 `expires` 已是過去時間，設定檔不符合資格，原因為 `expired`。
5. `tokenRef` 不會略過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意與資格檢查語意一致。
2. 對於符合資格的設定檔，可從內嵌值或 `tokenRef` 解析權杖內容。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## 代理程式複製可攜性

代理程式驗證繼承採用透讀方式。當代理程式沒有本機設定檔時，會在執行階段從預設／主要代理程式儲存區解析設定檔，而不會將祕密內容複製到自身的憑證儲存區（`agents/<agentId>/agent/openclaw-agent.sqlite`）。

明確的複製流程（例如 `openclaw agents add`）使用以下可攜性原則：

- 除非設定 `copyToAgents: false`，否則 `api_key` 與 `token` 設定檔可攜。
- `oauth` 設定檔預設不可攜，因為重新整理權杖可能只能使用一次，或對輪替機制敏感。
- 僅當已知在代理程式之間複製重新整理資料是安全的情況下，由提供者擁有的 OAuth 流程才能透過 `copyToAgents: true` 選擇啟用；此選擇啟用僅適用於設定檔含有內嵌存取／重新整理資料時。

不可攜的設定檔仍可透過透讀繼承使用，除非目標代理程式另行登入並建立自己的本機設定檔。

## 僅限設定的驗證路由

具有 `mode: "aws-sdk"` 的 `auth.profiles` 項目是路由中繼資料，而非儲存的憑證。當目標提供者使用 `models.providers.<id>.auth: "aws-sdk"` 時，這些項目有效；這也是外掛擁有的 Amazon Bedrock 設定所寫入的路由。即使憑證儲存區中不存在相符項目，這些設定檔 ID 仍可出現在 `auth.order` 與工作階段覆寫中。

請勿將 `type: "aws-sdk"` 寫入憑證儲存區；儲存的憑證只能是 `api_key`、`token` 或 `oauth`。若舊版 `auth-profiles.json` 含有這類標記，`openclaw doctor --fix` 會將其移至 `auth.profiles`，並從儲存區移除該標記。

## 明確驗證順序篩選

- 對提供者設定 `auth.order.<provider>` 或驗證儲存區順序覆寫時，`models status --probe` 只會探測仍在該提供者解析後驗證順序中的設定檔 ID。儲存的覆寫優先於 `auth.order` 設定。
- 若該提供者的已儲存設定檔未列入明確順序，之後不會在未提示的情況下嘗試使用。探測輸出會以 `reasonCode: excluded_by_auth_order` 回報，並包含詳細資訊 `Excluded by auth.order for this provider.`。

## 探測目標解析

- 探測目標可來自驗證設定檔、環境憑證或 `models.json`（結果 `source`：`profile`、`env`、`models.json`）。
- 若提供者具有憑證，但 OpenClaw 無法為其解析出可探測的候選模型，`models status --probe` 會回報 `status: no_model` 與 `reasonCode: no_model`。

## 外部命令列介面憑證探索

- 由外部命令列介面擁有、僅供執行階段使用的憑證（`claude-cli` 的 Claude CLI、`openai` 的 Codex CLI、`minimax-portal` 的 MiniMax CLI），僅會在提供者、執行階段或驗證設定檔屬於目前操作範圍時，或該外部來源已有儲存的本機設定檔時才進行探索。
- 驗證儲存區呼叫端會選擇明確的外部命令列介面探索模式：`none` 僅使用持久化／外掛驗證、`existing` 重新整理已儲存的外部命令列介面設定檔，或 `scoped` 使用具體的提供者／設定檔集合。
- 唯讀／狀態路徑會傳入 `allowKeychainPrompt: false`；它們只使用檔案支援的外部命令列介面憑證，且不會讀取或重複使用 macOS Keychain 的結果。

## OAuth SecretRef 原則防護

SecretRef 輸入僅適用於靜態憑證。OAuth 憑證可在執行階段變更（重新整理流程會持久化輪替後的權杖），因此以 SecretRef 支援 OAuth 資料會使可變狀態分散於不同儲存區。

- 若設定檔憑證為 `type: "oauth"`，該設定檔任何憑證資料欄位中的 SecretRef 物件都會遭到拒絕。
- 若 `auth.profiles.<id>.mode` 為 `"oauth"`，該設定檔中由 SecretRef 支援的 `keyRef`／`tokenRef` 輸入會遭到拒絕。
- 違規情況會在啟動／重新載入的祕密準備與設定檔解析路徑中造成硬性失敗（擲回錯誤）。

## 舊版相容訊息

為維持指令碼相容性，探測錯誤會保留以下第一行不變：

`Auth profile credentials are missing or expired.`

後續行會以 `↳ Auth reason [code]: ...` 格式提供易於理解的詳細資訊與穩定原因代碼。

## 相關內容

- [祕密管理](/zh-TW/gateway/secrets)
- [驗證儲存](/zh-TW/concepts/oauth)
