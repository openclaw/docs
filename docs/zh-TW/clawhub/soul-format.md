---
read_when:
    - 發布靈魂
    - 偵錯 soul 發布失敗
summary: Soul bundle 格式、必要檔案與限制。
x-i18n:
    generated_at: "2026-05-11T22:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# 靈魂格式

## 在磁碟上

一個靈魂是單一檔案：

- `SOUL.md`（或 `soul.md`）

目前，onlycrabs.ai 會拒絕任何額外檔案。

## `SOUL.md`

- Markdown，可選用 YAML frontmatter。
- 伺服器會在發布期間從 frontmatter 擷取中繼資料。
- `description` 會作為 UI/搜尋中的靈魂摘要。

## 限制

- 總 bundle 大小：50MB。
- 嵌入文字僅包含 `SOUL.md`。

## Slug

- 預設由資料夾名稱衍生。
- 必須為小寫且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本管理 + 標籤

- 每次發布都會建立新版本（semver）。
- 標籤是指向某個版本的字串指標；通常會使用 `latest`。
