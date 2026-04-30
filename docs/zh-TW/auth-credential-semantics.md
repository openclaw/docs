---
read_when:
    - 處理身分驗證設定檔解析或憑證路由
    - 偵錯模型身分驗證失敗或設定檔順序
summary: 身分驗證設定檔的標準憑證適用條件與解析語意
title: 驗證憑證語意
x-i18n:
    generated_at: "2026-04-30T02:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

本文件定義下列各處使用的標準認證資料資格與解析語意：

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

## 權杖認證資料

權杖認證資料（`type: "token"`）支援內嵌 `token` 和/或 `tokenRef`。

### 資格規則

1. 當 `token` 和 `tokenRef` 兩者皆不存在時，權杖設定檔不符合資格。
2. `expires` 是選用項。
3. 如果存在 `expires`，它必須是大於 `0` 的有限數字。
4. 如果 `expires` 無效（`NaN`、`0`、負數、非有限值或型別錯誤），設定檔不符合資格，原因為 `invalid_expires`。
5. 如果 `expires` 是過去時間，設定檔不符合資格，原因為 `expired`。
6. `tokenRef` 不會略過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意與資格語意相符。
2. 對符合資格的設定檔，權杖內容可從內嵌值或 `tokenRef` 解析。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## 代理程式複本可攜性

代理程式驗證繼承採用讀穿模式。當代理程式沒有本機設定檔時，
它可在執行階段從預設/主要代理程式儲存區解析設定檔，而不需將
秘密內容複製到自己的 `auth-profiles.json`。

明確複製流程（例如 `openclaw agents add`）會使用此可攜性政策：

- `api_key` 設定檔可攜，除非 `copyToAgents: false`。
- `token` 設定檔可攜，除非 `copyToAgents: false`。
- `oauth` 設定檔預設不可攜，因為重新整理權杖可能是
  單次使用或對輪替敏感。
- 由提供者擁有的 OAuth 流程只有在已知可安全跨代理程式
  複製重新整理內容時，才能以 `copyToAgents: true` 選擇加入。

不可攜設定檔仍可透過讀穿繼承使用，除非目標代理程式
另外登入並建立自己的本機設定檔。

## 明確驗證順序篩選

- 當為某個提供者設定 `auth.order.<provider>` 或驗證儲存區順序覆寫時，
  `models status --probe` 只會探測仍保留在該提供者已解析驗證順序中的
  設定檔 ID。
- 該提供者的已儲存設定檔若從明確順序中省略，
  之後不會被靜默嘗試。探測輸出會以
  `reasonCode: excluded_by_auth_order` 回報，詳細資訊為
  `Excluded by auth.order for this provider.`

## 探測目標解析

- 探測目標可以來自驗證設定檔、環境認證資料或
  `models.json`。
- 如果提供者具有認證資料，但 OpenClaw 無法為其解析可探測的模型
  候選項，`models status --probe` 會回報 `status: no_model`，並帶有
  `reasonCode: no_model`。

## 外部 CLI 認證資料探索

- 由外部 CLI 擁有的僅執行階段認證資料，只會在
  提供者、執行階段或驗證設定檔屬於目前操作範圍時探索，或在
  該外部來源的已儲存本機設定檔已存在時探索。
- 唯讀/狀態路徑會傳入 `allowKeychainPrompt: false`；它們只使用檔案支援的
  外部 CLI 認證資料，且不會讀取或重用 macOS Keychain 結果。

## OAuth SecretRef 政策防護

- SecretRef 輸入僅適用於靜態認證資料。
- 如果設定檔認證資料是 `type: "oauth"`，則該設定檔認證資料內容不支援 SecretRef 物件。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，則會拒絕該設定檔使用由 SecretRef 支援的 `keyRef`/`tokenRef` 輸入。
- 違規會在啟動/重新載入驗證解析路徑中造成硬性失敗。

## 舊版相容訊息

為了維持腳本相容性，探測錯誤會讓第一行保持不變：

`Auth profile credentials are missing or expired.`

後續行可加入適合閱讀的詳細資訊與穩定原因代碼。

## 相關

- [秘密管理](/zh-TW/gateway/secrets)
- [驗證儲存](/zh-TW/concepts/oauth)
