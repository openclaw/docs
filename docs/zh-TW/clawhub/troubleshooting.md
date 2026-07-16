---
read_when:
    - ClawHub 命令列介面或 OpenClaw 登錄檔命令失敗
    - 套件無法安裝、發布或更新
summary: 疑難排解 ClawHub 登入、安裝、發布、更新及 API 問題。
x-i18n:
    generated_at: "2026-07-16T11:27:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 疑難排解

## `clawhub login` 會開啟瀏覽器，但始終無法完成

命令列介面會在瀏覽器登入期間啟動一個短暫運作的本機回呼伺服器。

- 請確認瀏覽器可以連線至 `http://127.0.0.1:<port>/callback`。
- 如果始終未收到回呼，請檢查本機防火牆、VPN 與 Proxy 規則。
- 在無頭環境中，請在 ClawHub 網頁介面建立 API 權杖，然後執行：

```bash
clawhub login --token clh_...
```

## `whoami` 或 `publish` 傳回 `Unauthorized` (401)

- 請使用 `clawhub login` 重新登入。
- 如果使用自訂設定路徑，請確認 `CLAWHUB_CONFIG_PATH` 指向
  包含目前權杖的檔案。
- 如果使用 API 權杖，請確認該權杖未在網頁介面中遭撤銷。

## 搜尋或安裝傳回 `Rate limit exceeded` (429)

請閱讀回應中的重試資訊：

- `Retry-After`：重試前要等待的秒數。
- `RateLimit-Limit`：套用至此請求的限制。
- `RateLimit-Remaining`：標頭存在時，精確的剩餘額度。在 `429` 上，其值為 `0`。
- `RateLimit-Reset` 或 `X-RateLimit-Reset`：重設時間。

如果許多使用者共用同一個出口 IP，即使每個人只傳送少量請求，
仍可能觸及匿名 IP 限制。請盡可能登入，並在回報的延遲時間後
重試。

## 透過 Proxy 時搜尋或安裝失敗

命令列介面遵循標準 Proxy 變數：

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

支援的名稱包括 `HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy` 與
`http_proxy`。

## 搜尋結果中未顯示某個 Skill

- 如果知道確切的 slug 或擁有者頁面，請前往查看。
- 請確認該版本為公開狀態，且未因掃描或審核而遭保留。
- 如果你擁有該 Skill，請登入並檢查：

```bash
clawhub inspect @openclaw/demo
```

只有擁有者可見的診斷資訊可能會說明掃描、上傳閘門或審核狀態。

## 因缺少必要的中繼資料而無法發布

若為 Skills，請檢查 `SKILL.md` frontmatter。應宣告必要的環境變數與
工具，讓使用者和掃描程式能夠瞭解套件。

若為外掛，請檢查 `package.json` 相容性中繼資料。發布程式碼外掛時，
需要 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion` 等 OpenClaw 相容性欄位。

請先預覽發布承載資料：

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## 因 GitHub 擁有者或來源錯誤而無法發布

ClawHub 使用 GitHub 身分與來源歸屬，將套件連結至其
發布者。

- 請確認你已使用擁有該套件或可發布該套件的 GitHub 帳號
  登入。
- 請檢查來源 URL 是否為公開，或 ClawHub 是否能夠存取。
- 若為 GitHub 來源，請使用 `owner/repo`、`owner/repo@ref` 或完整的 GitHub URL。

## 因命名空間已被認領或保留而無法發布

如果發布因擁有者代號、組織命名空間、套件範圍、Skill slug 或套件名稱
已被認領或保留而失敗，請先確認執行發布的擁有者與該命名空間
相符。若為外掛套件，`@example-org/example-plugin` 等限定範圍的名稱必須由
相符的 `example-org` 擁有者發布。

如果你認為自己的組織、專案或品牌才是該命名空間的正當擁有者，但
無法管理目前的 ClawHub 擁有者，請使用公開且非敏感的證明建立
[組織／命名空間認領問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)。
如需證明指南及哪些內容不應放入公開問題中，請參閱
[組織與命名空間認領](/clawhub/namespace-claims)。

## `sync` 表示找不到任何 Skills

`sync` 會尋找包含 `SKILL.md` 或 `skill.md` 的資料夾。

將它指向要掃描的根目錄：

```bash
clawhub sync --root /path/to/skills
```

如果不確定將發布哪些內容，請先預覽：

```bash
clawhub sync --all --dry-run --no-input
```

## `update` 因本機變更而拒絕執行

本機檔案與 ClawHub 所知的任何版本都不相符。請選擇一種做法：

- 保留本機編輯並略過更新。
- 以已發布的版本覆寫：

```bash
clawhub update @openclaw/demo --force
```

- 使用新的 slug 或分支版本發布編輯後的副本。

## 在 OpenClaw 中安裝外掛失敗

- 請使用明確的 ClawHub 來源：

```bash
openclaw plugins install clawhub:<package>
```

- 請查看套件詳細資料頁面中的掃描狀態與相容性中繼資料。
- 請確認你的 OpenClaw 版本符合套件所標示的
  相容性範圍。
- 如果套件遭隱藏、保留或封鎖，在擁有者解決問題前，
  該套件可能無法安裝。

## 公開 API 請求失敗

- 請遵守 `429` 重試標頭，並快取公開的清單／搜尋回應。
- 將使用者連結回 ClawHub 的標準套件頁面。
- 請勿在公開 API 介面以外鏡像隱藏、私人、保留或遭審核
  封鎖的內容。

如需端點詳細資訊，請參閱 [HTTP API](/clawhub/http-api)。
