---
x-i18n:
    generated_at: "2026-05-10T19:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# 文件指南

此目錄負責文件撰寫、Mintlify 連結規則，以及文件 i18n 政策。

## Mintlify 規則

- 文件託管在 Mintlify (`https://docs.openclaw.ai`)。
- `docs/**/*.md` 中的內部文件連結必須保持為根目錄相對路徑，且不得有 `.md` 或 `.mdx` 後綴（範例：`[Config](/gateway/configuration)`）。
- 區段交叉參照應在根目錄相對路徑上使用錨點（範例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文件標題應避免使用長破折號和撇號，因為 Mintlify 的錨點產生在這些字元上很脆弱。
- README 和其他由 GitHub 呈現的文件應保留絕對文件 URL，讓連結能在 Mintlify 之外運作。
- 文件內容必須保持通用：不得包含個人裝置名稱、主機名稱或本機路徑；請使用像 `user@gateway-host` 這類預留位置。

## 文件內容規則

- 對於文件、UI 文案和選擇器清單，除非該區段明確描述執行階段順序或自動偵測順序，否則服務/供應商應依字母順序排列。
- 保持隨附 Plugin 命名與根 `AGENTS.md` 中的全儲存庫 Plugin 術語規則一致。

## 內部文件

- 長期私有操作員文件應放在 `~/Projects/manager/docs/`。
- 儲存庫本機的內部暫存/鏡像文件可放在已忽略的 `docs/internal/` 底下。
- 絕不要將 `docs/internal/**` 頁面加入 `docs/docs.json` 導覽，也不要從公開文件連結到它們。
- 如果之後有頁面被強制加入，`scripts/docs-sync-publish.mjs` 會從公開的 `openclaw/docs` 發布儲存庫排除並修剪 `docs/internal/**`。
- 內部文件可以提及儲存庫路徑、私有應用程式名稱、1Password 項目名稱和執行手冊，但絕不能包含秘密值。

## 文件 i18n

- 外語文件不在此儲存庫中維護。產生的發布輸出位於獨立的 `openclaw/docs` 儲存庫（本機通常複製為 `../openclaw-docs`）。
- 不要在此處的 `docs/<locale>/**` 底下新增或編輯本地化文件。
- 將此儲存庫中的英文文件加上詞彙表檔案視為事實來源。
- 管線：在此處更新英文文件，視需要更新 `docs/.i18n/glossary.<locale>.json`，然後讓發布儲存庫同步並在 `openclaw/docs` 中執行 `scripts/docs-i18n`。
- 重新執行 `scripts/docs-i18n` 前，請為任何必須保留英文或使用固定翻譯的新技術術語、頁面標題或簡短導覽標籤新增詞彙表條目。
- `pnpm docs:check-i18n-glossary` 是針對已變更英文文件標題和簡短內部文件標籤的防護。
- 翻譯記憶位於發布儲存庫中產生的 `docs/.i18n/*.tm.jsonl` 檔案。
- 請參閱 `docs/.i18n/README.md`。
