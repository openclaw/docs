---
x-i18n:
    generated_at: "2026-04-30T02:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 16
---

# 文件指南

此目錄負責文件撰寫、Mintlify 連結規則，以及文件 i18n 政策。

## Mintlify 規則

- 文件託管於 Mintlify (`https://docs.openclaw.ai`)。
- `docs/**/*.md` 中的內部文件連結必須保持根相對路徑，且不得有 `.md` 或 `.mdx` 後綴（範例：`[Config](/gateway/configuration)`）。
- 區段交叉參照應在根相對路徑上使用錨點（範例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文件標題應避免使用長破折號和撇號，因為 Mintlify 的錨點產生在這些字元上很脆弱。
- README 和其他由 GitHub 轉譯的文件應保留絕對文件 URL，讓連結在 Mintlify 之外也能運作。
- 文件內容必須保持通用：不得包含個人裝置名稱、主機名稱或本機路徑；請使用像 `user@gateway-host` 這樣的佔位符。

## 文件內容規則

- 對於文件、UI 文案和選擇器清單，除非該區段明確描述執行階段順序或自動偵測順序，否則服務/提供者應依字母順序排列。
- 保持隨附 Plugin 命名與根目錄 `AGENTS.md` 中 repo 全域的 Plugin 術語規則一致。

## 文件 i18n

- 此 repo 不維護外語文件。產生的發布輸出位於獨立的 `openclaw/docs` repo（本機通常複製為 `../openclaw-docs`）。
- 不要在此處的 `docs/<locale>/**` 下新增或編輯在地化文件。
- 將此 repo 中的英文文件與詞彙表檔案視為事實來源。
- 流程：在此處更新英文文件，視需要更新 `docs/.i18n/glossary.<locale>.json`，然後讓發布 repo 同步與 `scripts/docs-i18n` 在 `openclaw/docs` 中執行。
- 重新執行 `scripts/docs-i18n` 之前，請為任何必須保持英文或使用固定翻譯的新技術術語、頁面標題或短導覽標籤新增詞彙表項目。
- `pnpm docs:check-i18n-glossary` 是用於檢查已變更英文文件標題與短內部文件標籤的防護。
- 翻譯記憶位於發布 repo 中產生的 `docs/.i18n/*.tm.jsonl` 檔案。
- 請參閱 `docs/.i18n/README.md`。
