---
read_when:
    - ClawHub 命令列介面或 OpenClaw 登錄庫命令失敗
    - 套件無法安裝、發布或更新
summary: 疑難排解 ClawHub 登入、安裝、發布、更新和 API 問題。
x-i18n:
    generated_at: "2026-07-04T15:07:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 疑難排解

## `clawhub login` 開啟瀏覽器但永遠無法完成

命令列介面會在瀏覽器登入期間啟動短生命週期的本機回呼伺服器。

- 確認你的瀏覽器可以連到 `http://127.0.0.1:<port>/callback`。
- 如果回呼一直沒有抵達，請檢查本機防火牆、VPN 和代理規則。
- 在無頭環境中，請在 ClawHub 網頁使用者介面建立 API 權杖，然後執行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 回傳 `Unauthorized` (401)

- 使用 `clawhub login` 重新登入。
- 如果你使用自訂設定路徑，請確認 `CLAWHUB_CONFIG_PATH` 指向包含目前權杖的
  檔案。
- 如果你使用 API 權杖，請確認它未在網頁使用者介面中被撤銷。

## 搜尋或安裝回傳 `Rate limit exceeded` (429)

請閱讀回應中的重試資訊：

- `Retry-After`：重試前要等待的秒數。
- `RateLimit-Limit`：套用到此請求的限制。
- `RateLimit-Remaining`：當標頭存在時，你的精確剩餘額度。在 `429` 上為 `0`。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重設時間。

如果許多使用者共用同一個出口 IP，即使每個人只傳送少量請求，也可能觸及匿名 IP 限制。請盡可能登入，並在回報的延遲時間後重試。

## 搜尋或安裝在代理後方失敗

命令列介面遵循標準代理變數：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支援的名稱包含 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和
`http_proxy`。

## 某項技能未出現在搜尋中

- 如果你知道確切的 slug 或擁有者頁面，請檢查它。
- 確認發布版本是公開的，且未因掃描或審核而被保留。
- 如果你擁有該技能，請登入並檢查它：

```bash
clawhub inspect @openclaw/demo
```

擁有者可見的診斷資訊可能會說明掃描、上傳閘門或審核狀態。

## 發布因缺少必要中繼資料而失敗

若為技能，請檢查 `SKILL.md` frontmatter。必要的環境變數和
工具應加以宣告，讓使用者和掃描器能理解該套件。

若為外掛，請檢查 `package.json` 相容性中繼資料。Code-plugin 發布
需要 OpenClaw 相容性欄位，例如 `openclaw.compat.pluginApi` 和
`openclaw.build.openclawVersion`。

先預覽發布承載內容：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 發布因 GitHub 擁有者或來源錯誤而失敗

ClawHub 使用 GitHub 身分和來源歸屬，將套件連結到其
發布者。

- 確認你已使用擁有該套件或可發布該套件的 GitHub 帳號登入。
- 檢查來源 URL 是否公開，或 ClawHub 是否可以存取。
- 對於 GitHub 來源，請使用 `owner/repo`、`owner/repo@ref`，或完整的 GitHub URL。

## 發布因命名空間已被認領或保留而失敗

如果發布因擁有者 handle、組織命名空間、套件 scope、技能
slug 或套件名稱已被認領或保留而失敗，請先確認你是以符合該命名空間的擁有者身分
發布。對於外掛套件，
像 `@example-org/example-plugin` 這類 scoped 名稱必須以相符的
`example-org` 擁有者發布。

如果你認為你的組織、專案或品牌是該命名空間的正當擁有者，但
你無法管理目前的 ClawHub 擁有者，請開立
[組織／命名空間認領議題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，
並附上公開且非敏感的證明。請參閱
[組織與命名空間認領](/clawhub/namespace-claims)，了解證據指引，以及哪些內容
不應放入公開議題。

## `sync` 表示找不到技能

`sync` 會尋找包含 `SKILL.md` 或 `skill.md` 的資料夾。

將它指向你想掃描的根目錄：

```bash
clawhub sync --root /path/to/skills
```

如果你不確定會發布什麼，請先預覽：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本機變更而拒絕執行

本機檔案與 ClawHub 已知的任何版本都不相符。請選擇一項：

- 保留本機編輯並略過更新。
- 以已發布版本覆寫：

```bash
clawhub update @openclaw/demo --force
```

- 將你編輯過的副本發布為新的 slug 或 fork。

## 外掛安裝在 OpenClaw 中失敗

- 使用明確的 ClawHub 來源：

```bash
openclaw plugins install clawhub:<package>
```

- 檢查套件詳細資訊頁面的掃描狀態和相容性中繼資料。
- 確認你的 OpenClaw 版本符合套件宣告的
  相容性範圍。
- 如果套件被隱藏、保留或封鎖，可能要等到
  擁有者解決問題後才能安裝。

## 公開 API 請求失敗

- 遵守 `429` 重試標頭，並快取公開清單／搜尋回應。
- 將使用者連回正式的 ClawHub 清單。
- 不要在公開 API 介面之外鏡像隱藏、私有、保留或因審核而封鎖的內容。

請參閱 [HTTP API](/clawhub/http-api) 了解端點詳細資訊。
