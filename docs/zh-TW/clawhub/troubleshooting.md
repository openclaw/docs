---
read_when:
    - ClawHub 命令列介面或 OpenClaw 登錄庫命令執行失敗
    - 無法安裝、發佈或更新套件
summary: 疑難排解 ClawHub 登入、安裝、發佈、更新及 API 問題。
x-i18n:
    generated_at: "2026-07-11T21:11:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 疑難排解

## `clawhub login` 開啟瀏覽器但始終無法完成

命令列介面會在瀏覽器登入期間啟動一個短暫存在的本機回呼伺服器。

- 請確認瀏覽器可以連線至 `http://127.0.0.1:<port>/callback`。
- 如果回呼始終未送達，請檢查本機防火牆、VPN 和 Proxy 規則。
- 在無頭環境中，請在 ClawHub 網頁介面建立 API 權杖，然後執行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 傳回 `Unauthorized` (401)

- 使用 `clawhub login` 重新登入。
- 如果使用自訂設定路徑，請確認 `CLAWHUB_CONFIG_PATH` 指向包含目前權杖的檔案。
- 如果使用 API 權杖，請確認該權杖未在網頁介面中遭到撤銷。

## 搜尋或安裝傳回 `Rate limit exceeded` (429)

請查看回應中的重試資訊：

- `Retry-After`：重試前應等待的秒數。
- `RateLimit-Limit`：套用於此請求的限制。
- `RateLimit-Remaining`：標頭存在時，表示確切的剩餘額度。發生 `429` 時，其值為 `0`。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：限制重設時間。

如果許多使用者共用同一個出口 IP，即使每個人只傳送少量請求，也可能觸及匿名 IP 限制。請盡可能登入，並在回報的延遲時間過後重試。

## 在 Proxy 後方搜尋或安裝失敗

命令列介面會遵循標準 Proxy 變數：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支援的名稱包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 和 `http_proxy`。

## 搜尋結果中未顯示某個 Skill

- 如果知道確切的 slug 或擁有者頁面，請直接檢查。
- 請確認該版本已公開，且未因掃描或審核而遭到暫緩。
- 如果您擁有該 Skill，請登入並檢查：

```bash
clawhub inspect @openclaw/demo
```

僅擁有者可見的診斷資訊可能會說明掃描、上傳閘門或審核狀態。

## 發佈因缺少必要中繼資料而失敗

對於 Skills，請檢查 `SKILL.md` 的 frontmatter。應宣告必要的環境變數和工具，讓使用者與掃描程式可以瞭解套件。

對於外掛，請檢查 `package.json` 的相容性中繼資料。程式碼外掛的發佈需要 OpenClaw 相容性欄位，例如 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

請先預覽發佈承載內容：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 發佈因 GitHub 擁有者或來源錯誤而失敗

ClawHub 使用 GitHub 身分與來源歸屬，將套件連結至其發佈者。

- 請確認您已使用擁有該套件或有權發佈該套件的 GitHub 帳戶登入。
- 請檢查來源 URL 是否公開，或 ClawHub 是否可以存取。
- 對於 GitHub 來源，請使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## 發佈因命名空間已被占用或保留而失敗

如果發佈因擁有者代號、組織命名空間、套件範圍、Skill slug 或套件名稱已被占用或保留而失敗，請先確認您是以與該命名空間相符的擁有者身分進行發佈。對於外掛套件，`@example-org/example-plugin` 之類的限定範圍名稱，必須以相符的 `example-org` 擁有者身分發佈。

如果您認為自己的組織、專案或品牌是該命名空間的正當擁有者，但無法管理目前的 ClawHub 擁有者，請建立一個 [組織／命名空間主張問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，並附上公開且不含敏感資訊的證明。請參閱[組織與命名空間主張](/clawhub/namespace-claims)，瞭解證據指南以及不應放入公開問題的內容。

## `sync` 顯示找不到任何 Skills

`sync` 會尋找包含 `SKILL.md` 或 `skill.md` 的資料夾。

請將它指向您要掃描的根目錄：

```bash
clawhub sync --root /path/to/skills
```

如果不確定將發佈哪些內容，請先預覽：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本機變更而拒絕執行

本機檔案與 ClawHub 已知的任何版本都不相符。請選擇下列其中一項：

- 保留本機編輯並略過更新。
- 使用已發佈的版本覆寫：

```bash
clawhub update @openclaw/demo --force
```

- 將編輯後的副本以新的 slug 或分支版本發佈。

## 在 OpenClaw 中安裝外掛失敗

- 使用明確的 ClawHub 來源：

```bash
openclaw plugins install clawhub:<package>
```

- 檢查套件詳細資料頁面中的掃描狀態與相容性中繼資料。
- 確認您的 OpenClaw 版本符合套件所宣告的相容性範圍。
- 如果套件遭到隱藏、暫緩或封鎖，在擁有者解決問題之前可能無法安裝。

## 公開 API 請求失敗

- 遵循 `429` 重試標頭，並快取公開的清單／搜尋回應。
- 將使用者連結回 ClawHub 的正式清單頁面。
- 請勿在公開 API 範圍之外鏡像隱藏、私人、暫緩或因審核而封鎖的內容。

如需端點詳細資訊，請參閱 [HTTP API](/clawhub/http-api)。
