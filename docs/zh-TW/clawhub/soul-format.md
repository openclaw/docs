---
read_when:
    - 發布靈魂
    - 偵錯 soul publish 失敗
summary: 靈魂套件格式、必要檔案與限制。
x-i18n:
    generated_at: "2026-05-13T05:33:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul 格式

## 在磁碟上

soul 是單一檔案：

- `SOUL.md`（或 `soul.md`）

目前，onlycrabs.ai 會拒絕任何額外檔案。

## `SOUL.md`

- Markdown，可選擇加入 YAML frontmatter。
- 伺服器會在發布期間從 frontmatter 擷取中繼資料。
- `description` 會用作 UI/搜尋中的 soul 摘要。

## 限制

- 總 bundle 大小：50MB。
- 嵌入文字僅包含 `SOUL.md`。

## Slugs

- 預設由資料夾名稱衍生。
- 必須為小寫且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本控制 + 標籤

- 每次發布都會建立新版本（semver）。
- 標籤是指向某個版本的字串指標；`latest` 很常使用。
