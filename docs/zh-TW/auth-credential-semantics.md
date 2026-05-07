---
read_when:
    - 正在處理身分驗證設定檔解析或憑證路由
    - 模型身分驗證失敗或設定檔順序的除錯
summary: 身分驗證設定檔的標準憑證適用資格與解析語意
title: 認證憑證語義
x-i18n:
    generated_at: "2026-05-07T13:13:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文件定義以下各處使用的標準憑證資格與解析語意：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目標是讓選取時與執行階段的行為保持一致。

## 穩定的探測原因代碼

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## 權杖憑證

權杖憑證（`type: "token"`）支援內嵌 `token` 和/或 `tokenRef`。

### 資格規則

1. 當 `token` 和 `tokenRef` 都不存在時，權杖設定檔不符合資格。
2. `expires` 是選用項。
3. 如果有 `expires`，它必須是大於 `0` 的有限數字。
4. 如果 `expires` 無效（`NaN`、`0`、負數、非有限值或型別錯誤），設定檔不符合資格，原因為 `invalid_expires`。
5. 如果 `expires` 是過去時間，設定檔不符合資格，原因為 `expired`。
6. `tokenRef` 不會略過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意會符合資格語意。
2. 對於符合資格的設定檔，權杖材料可從內嵌值或 `tokenRef` 解析。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## Agent 複製可攜性

Agent 驗證繼承是透過讀取穿透運作。當 Agent 沒有本機設定檔時，它
可以在執行階段從預設/主要 Agent 儲存解析設定檔，而無需
將秘密材料複製到自己的 `auth-profiles.json`。

明確複製流程（例如 `openclaw agents add`）使用此可攜性政策：

- 除非 `copyToAgents: false`，否則 `api_key` 設定檔可攜。
- 除非 `copyToAgents: false`，否則 `token` 設定檔可攜。
- `oauth` 設定檔預設不可攜，因為重新整理權杖可能是
  單次使用或對輪替敏感。
- 提供者擁有的 OAuth 流程僅可在已知跨 Agent 複製
  重新整理材料是安全的情況下，以 `copyToAgents: true` 選擇加入。

不可攜的設定檔仍可透過讀取穿透繼承使用，除非
目標 Agent 分別登入並建立自己的本機設定檔。

## 僅設定的驗證路由

具有 `mode: "aws-sdk"` 的 `auth.profiles` 項目是路由中繼資料，而非儲存的
憑證。當目標提供者使用
`models.providers.<id>.auth: "aws-sdk"` 或內建 Amazon Bedrock 預設
AWS SDK 路由時，這些項目有效。即使 `auth-profiles.json` 中沒有相符項目，
這些設定檔 ID 也可以出現在 `auth.order` 和工作階段
覆寫中。

不要將 `type: "aws-sdk"` 寫入 `auth-profiles.json`。如果舊版安裝
有這類標記，`openclaw doctor --fix` 會將它移至 `auth.profiles`，並
從憑證儲存中移除該標記。

## 明確驗證順序篩選

- 當某個提供者設定了 `auth.order.<provider>` 或驗證儲存順序覆寫時，
  `models status --probe` 只會探測仍保留在該提供者
  已解析驗證順序中的設定檔 ID。
- 該提供者的已儲存設定檔若從明確順序中省略，
  之後不會被默默嘗試。探測輸出會以
  `reasonCode: excluded_by_auth_order` 和詳細資訊
  `Excluded by auth.order for this provider.` 回報它。

## 探測目標解析

- 探測目標可以來自驗證設定檔、環境憑證或
  `models.json`。
- 如果提供者有憑證，但 OpenClaw 無法為其解析可探測模型
  候選項，`models status --probe` 會以
  `reasonCode: no_model` 回報 `status: no_model`。

## 外部 CLI 憑證探索

- 外部 CLI 擁有的僅執行階段憑證，只會在
  提供者、執行階段或驗證設定檔位於目前操作範圍內時，
  或者該外部來源已有已儲存本機設定檔時才會被探索。
- 驗證儲存呼叫端應選擇明確的外部 CLI 探索模式：
  `none` 用於僅持久化/Plugin 驗證，`existing` 用於重新整理已
  儲存的外部 CLI 設定檔，或 `scoped` 用於具體提供者/設定檔集合。
- 唯讀/狀態路徑會傳遞 `allowKeychainPrompt: false`；它們只使用以檔案為後端的
  外部 CLI 憑證，且不會讀取或重用 macOS Keychain 結果。

## OAuth SecretRef 政策防護

- SecretRef 輸入僅適用於靜態憑證。
- 如果設定檔憑證是 `type: "oauth"`，該設定檔憑證材料不支援 SecretRef 物件。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，則會拒絕該設定檔中由 SecretRef 支援的 `keyRef`/`tokenRef` 輸入。
- 違規會在啟動/重新載入驗證解析路徑中造成硬性失敗。

## 舊版相容訊息

為了指令碼相容性，探測錯誤會保留第一行不變：

`Auth profile credentials are missing or expired.`

後續行可加入易懂的詳細資訊與穩定原因代碼。

## 相關

- [秘密管理](/zh-TW/gateway/secrets)
- [驗證儲存](/zh-TW/concepts/oauth)
