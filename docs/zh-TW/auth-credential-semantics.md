---
read_when:
    - 處理身分驗證設定檔解析或憑證路由
    - 除錯模型身分驗證失敗或設定檔順序
summary: auth 設定檔的標準憑證資格與解析語意
title: 驗證憑證語意
x-i18n:
    generated_at: "2026-06-27T18:54:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

此文件定義以下各處使用的標準憑證資格與解析語意：

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

1. 當 `token` 和 `tokenRef` 皆不存在時，權杖設定檔不符合資格。
2. `expires` 為選用。
3. 如果存在 `expires`，它必須是大於 `0` 的有限數字。
4. 如果 `expires` 無效（`NaN`、`0`、負數、非有限值或型別錯誤），設定檔會因 `invalid_expires` 而不符合資格。
5. 如果 `expires` 是過去時間，設定檔會因 `expired` 而不符合資格。
6. `tokenRef` 不會繞過 `expires` 驗證。

### 解析規則

1. 解析器對 `expires` 的語意與資格語意一致。
2. 對符合資格的設定檔，權杖資料可從內嵌值或 `tokenRef` 解析。
3. 無法解析的參照會在 `models status --probe` 輸出中產生 `unresolved_ref`。

## 代理程式複製可攜性

代理程式驗證繼承是讀穿式的。當代理程式沒有本機設定檔時，它
可以在執行階段從預設/主要代理程式儲存區解析設定檔，而不必
將祕密資料複製到自己的 `auth-profiles.json`。

明確的複製流程，例如 `openclaw agents add`，使用此可攜性政策：

- `api_key` 設定檔具有可攜性，除非 `copyToAgents: false`。
- `token` 設定檔具有可攜性，除非 `copyToAgents: false`。
- `oauth` 設定檔預設不具可攜性，因為重新整理權杖可能是
  一次性或對輪替敏感。
- 供應商擁有的 OAuth 流程只有在已知跨代理程式複製重新整理資料是安全的情況下，
  才能透過 `copyToAgents: true` 選擇加入。

不可攜的設定檔仍可透過讀穿式繼承使用，除非
目標代理程式另行登入並建立自己的本機設定檔。

## 僅設定檔的驗證路由

含有 `mode: "aws-sdk"` 的 `auth.profiles` 項目是路由中繼資料，而不是已儲存的
憑證。當目標供應商使用
`models.providers.<id>.auth: "aws-sdk"` 或外掛擁有的 Amazon Bedrock 設定
AWS SDK 路由時，這些項目有效。即使 `auth-profiles.json` 中不存在相符項目，
這些設定檔 id 也可能出現在 `auth.order` 和工作階段
覆寫中。

不要將 `type: "aws-sdk"` 寫入 `auth-profiles.json`。如果舊版安裝
有這類標記，`openclaw doctor --fix` 會將它移到 `auth.profiles`，並
從憑證儲存區移除該標記。

## 明確的驗證順序篩選

- 當針對某個供應商設定了 `auth.order.<provider>` 或驗證儲存區順序覆寫時，
  `models status --probe` 只會探測仍保留在該供應商
  已解析驗證順序中的設定檔 id。
- 對該供應商而言，從明確順序中省略的已儲存設定檔
  不會在稍後被靜默嘗試。探測輸出會以
  `reasonCode: excluded_by_auth_order` 回報它，並附上詳細資訊
  `Excluded by auth.order for this provider.`

## 探測目標解析

- 探測目標可以來自驗證設定檔、環境憑證或
  `models.json`。
- 如果供應商有憑證，但 OpenClaw 無法為其解析可探測的模型
  候選項目，`models status --probe` 會以
  `reasonCode: no_model` 回報 `status: no_model`。

## 外部命令列介面憑證探索

- 由外部命令列介面擁有、僅供執行階段使用的憑證，只有在
  供應商、執行階段或驗證設定檔屬於目前操作範圍時，或
  該外部來源已有已儲存的本機設定檔時，才會被探索。
- 驗證儲存區呼叫者應選擇明確的外部命令列介面探索模式：
  `none` 表示僅持久化/外掛驗證，`existing` 表示重新整理已
  儲存的外部命令列介面設定檔，或 `scoped` 表示具體的供應商/設定檔集合。
- 唯讀/狀態路徑會傳入 `allowKeychainPrompt: false`；它們只使用檔案支援的
  外部命令列介面憑證，且不會讀取或重用 macOS Keychain 結果。

## OAuth SecretRef 政策防護

- SecretRef 輸入僅適用於靜態憑證。
- 如果設定檔憑證是 `type: "oauth"`，該設定檔憑證資料不支援 SecretRef 物件。
- 如果 `auth.profiles.<id>.mode` 是 `"oauth"`，該設定檔會拒絕由 SecretRef 支援的 `keyRef`/`tokenRef` 輸入。
- 違規會在啟動/重新載入驗證解析路徑中造成硬性失敗。

## 舊版相容訊息

為了指令碼相容性，探測錯誤會保持第一行不變：

`Auth profile credentials are missing or expired.`

可供人閱讀的詳細資訊與穩定原因代碼可新增於後續行。

## 相關

- [祕密管理](/zh-TW/gateway/secrets)
- [驗證儲存](/zh-TW/concepts/oauth)
