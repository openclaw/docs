---
read_when:
    - 處理身分驗證設定檔解析或憑證路由
    - 偵錯模型身分驗證失敗或設定檔順序
summary: 身分驗證設定檔的標準憑證適用資格與解析語意
title: 身分驗證憑證語意
x-i18n:
    generated_at: "2026-04-30T21:02:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文件定義下列各處使用的標準憑證資格與解析語意：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目標是讓選擇時與執行階段行為保持一致。

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

1. 當 `token` 和 `tokenRef` 皆不存在時，權杖設定檔不具資格。
2. `expires` 是選用項目。
3. 如果存在 `expires`，它必須是大於 `0` 的有限數字。
4. 如果 `expires` 無效（`NaN`、`0`、負數、非有限數，或類型錯誤），設定檔會因 `invalid_expires` 而不具資格。
5. 如果 `expires` 是過去時間，設定檔會因 `expired` 而不具資格。
6. `tokenRef` 不會略過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意符合資格語意。
2. 對於具資格的設定檔，權杖材料可從內嵌值或 `tokenRef` 解析。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## 代理副本可攜性

代理認證繼承採用透通讀取。當代理沒有本機設定檔時，它
可以在執行階段從預設/主要代理儲存區解析設定檔，而不需要
將秘密材料複製到自己的 `auth-profiles.json`。

明確複製流程，例如 `openclaw agents add`，會使用此可攜性政策：

- `api_key` 設定檔可攜，除非 `copyToAgents: false`。
- `token` 設定檔可攜，除非 `copyToAgents: false`。
- `oauth` 設定檔預設不可攜，因為重新整理權杖可能是
  單次使用或對輪替敏感。
- Provider 擁有的 OAuth 流程，只有在已知跨代理複製重新整理材料安全時，
  才可以使用 `copyToAgents: true` 選擇加入。

不可攜的設定檔仍可透過透通讀取繼承使用，除非
目標代理另外登入並建立自己的本機設定檔。

## 明確認證順序篩選

- 當某個 Provider 設定了 `auth.order.<provider>` 或認證儲存區順序覆寫時，
  `models status --probe` 只會探測該 Provider 已解析認證順序中保留的設定檔 ID。
- 該 Provider 的已儲存設定檔如果從明確順序中省略，
  之後不會被靜默嘗試。探測輸出會以
  `reasonCode: excluded_by_auth_order` 和詳細資訊
  `Excluded by auth.order for this provider.` 回報它。

## 探測目標解析

- 探測目標可以來自認證設定檔、環境憑證，或
  `models.json`。
- 如果 Provider 具有憑證，但 OpenClaw 無法為其解析可探測的模型
  候選項目，`models status --probe` 會以
  `reasonCode: no_model` 回報 `status: no_model`。

## 外部 CLI 憑證探索

- 外部 CLI 擁有的僅執行階段憑證，只有在
  Provider、執行階段或認證設定檔屬於目前操作範圍內，或
  已存在該外部來源的已儲存本機設定檔時才會被探索。
- 認證儲存區呼叫端應選擇明確的外部 CLI 探索模式：
  `none` 用於僅持久化/Plugin 認證，`existing` 用於重新整理已經
  儲存的外部 CLI 設定檔，或 `scoped` 用於具體的 Provider/設定檔集合。
- 唯讀/狀態路徑會傳入 `allowKeychainPrompt: false`；它們只使用檔案支援的
  外部 CLI 憑證，且不會讀取或重用 macOS Keychain 結果。

## OAuth SecretRef 政策防護

- SecretRef 輸入僅適用於靜態憑證。
- 如果設定檔憑證是 `type: "oauth"`，該設定檔憑證材料不支援 SecretRef 物件。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，該設定檔會拒絕以 SecretRef 支援的 `keyRef`/`tokenRef` 輸入。
- 違規會在啟動/重新載入認證解析路徑中成為硬性失敗。

## 與舊版相容的訊息

為了腳本相容性，探測錯誤會保持第一行不變：

`Auth profile credentials are missing or expired.`

可讀性較高的詳細資訊與穩定原因代碼可能會加在後續行。

## 相關

- [秘密管理](/zh-TW/gateway/secrets)
- [認證儲存](/zh-TW/concepts/oauth)
