---
read_when:
    - ClawHub CLI 或 OpenClaw 登錄檔命令失敗
    - 套件無法安裝、發布或更新
summary: 疑難排解 ClawHub 登入、安裝、發布、同步、更新和 API 問題。
x-i18n:
    generated_at: "2026-05-12T23:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 疑難排解

## `clawhub login` 開啟瀏覽器但一直無法完成

CLI 會在瀏覽器登入期間啟動一個短暫存在的本機回呼伺服器。

- 確認你的瀏覽器可以連到 `http://127.0.0.1:<port>/callback`。
- 如果一直收不到回呼，請檢查本機防火牆、VPN 和 Proxy 規則。
- 在無頭環境中，請在 ClawHub 網頁 UI 建立 API 權杖，然後執行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 回傳 `Unauthorized` (401)

- 使用 `clawhub login` 重新登入。
- 如果你使用自訂設定路徑，請確認 `CLAWHUB_CONFIG_PATH` 指向包含目前權杖的檔案。
- 如果你使用 API 權杖，請確認它沒有在網頁 UI 中被撤銷。

## 搜尋或安裝回傳 `Rate limit exceeded` (429)

請閱讀回應中的重試資訊：

- `Retry-After`：重試前要等待的秒數。
- `RateLimit-Remaining` 和 `RateLimit-Limit`：你目前的配額。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重設時間。

如果許多使用者共用同一個出口 IP，即使每個人只送出少量請求，也可能觸發匿名 IP 限制。請盡可能登入，並在回報的延遲時間後重試。

## 搜尋或安裝在 Proxy 後方失敗

CLI 會遵循標準 Proxy 變數：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支援的名稱包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和 `http_proxy`。

## Skill 未出現在搜尋結果中

- 如果你知道確切的 slug 或擁有者頁面，請檢查它。
- 確認該發行版本是公開的，且未被掃描或審核保留。
- 如果你擁有該 Skill，請登入並檢查它：

```bash
clawhub inspect <skill-slug>
```

擁有者可見的診斷資訊可能會說明掃描、上傳閘門或審核狀態。

## 發佈因缺少必要中繼資料而失敗

對於 Skills，請檢查 `SKILL.md` frontmatter。應宣告必要的環境變數和工具，讓使用者與掃描器能理解套件。

對於 plugins，請檢查 `package.json` 相容性中繼資料。程式碼 Plugin 發佈需要 OpenClaw 相容性欄位，例如 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

請先預覽發佈酬載：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 發佈因 GitHub 擁有者或來源錯誤而失敗

ClawHub 會使用 GitHub 身分與來源歸屬，將套件連結到其發佈者。

- 確認你已使用擁有或可發佈該套件的 GitHub 帳號登入。
- 檢查來源 URL 是公開的，或 ClawHub 可存取。
- 對於 GitHub 來源，請使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## `sync` 表示找不到 Skills

`sync` 會尋找包含 `SKILL.md` 或 `skill.md` 的資料夾。

請將它指向你要掃描的根目錄：

```bash
clawhub sync --root /path/to/skills
```

如果你不確定會發佈什麼，請先預覽：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本機變更而拒絕執行

本機檔案不符合 ClawHub 所知道的任何版本。請選擇一項：

- 保留本機編輯並略過更新。
- 以已發佈版本覆寫：

```bash
clawhub update <slug> --force
```

- 將你編輯過的副本發佈為新的 slug 或 fork。

## Plugin 在 OpenClaw 中安裝失敗

- 使用明確的 ClawHub 來源：

```bash
openclaw plugins install clawhub:<package>
```

- 檢查套件詳細資料頁面的掃描狀態與相容性中繼資料。
- 確認你的 OpenClaw 版本符合該套件標示的相容性範圍。
- 如果套件被隱藏、保留或封鎖，在擁有者解決問題前可能無法安裝。

## 公開 API 請求失敗

- 遵守 `429` 重試標頭，並快取公開清單／搜尋回應。
- 將使用者連回標準的 ClawHub 條目。
- 不要在公開 API 介面之外鏡像隱藏、私有、保留或因審核封鎖的內容。

請參閱 [HTTP API](/zh-TW/clawhub/http-api) 以取得端點詳細資訊。
