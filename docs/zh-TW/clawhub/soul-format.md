---
read_when:
    - 發布靈魂
    - 偵錯 soul 發布失敗
summary: Soul 封裝包格式、必要檔案與限制。
x-i18n:
    generated_at: "2026-05-12T08:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# 靈魂格式

## 在磁碟上

靈魂是一個單一檔案：

- `SOUL.md`（或 `soul.md`）

目前，onlycrabs.ai 會拒絕任何額外檔案。

## `SOUL.md`

- Markdown，可含選用的 YAML 前置資料。
- 伺服器會在發布期間從前置資料擷取中繼資料。
- `description` 會作為 UI/搜尋中的靈魂摘要。

## 限制

- 總套件大小：50MB。
- 嵌入文字只包含 `SOUL.md`。

## Slug

- 預設由資料夾名稱衍生。
- 必須為小寫且符合 URL 安全格式：`^[a-z0-9][a-z0-9-]*$`。

## 版本控制 + 標籤

- 每次發布都會建立新版本（semver）。
- 標籤是指向某個版本的字串指標；`latest` 很常用。
