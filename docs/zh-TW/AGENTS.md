---
x-i18n:
    generated_at: "2026-06-27T18:53:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# 文件指南

此目錄負責文件撰寫、Mintlify 連結規則，以及文件 i18n 政策。

## Mintlify 規則

- 文件託管在 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的內部文件連結必須保持根相對路徑，且不加 `.md` 或 `.mdx` 後綴（範例：`[Config](/gateway/configuration)`）。
- 章節交叉參照應在根相對路徑上使用錨點（範例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文件標題應避免使用破折號和撇號，因為 Mintlify 的錨點產生在這些字元上很脆弱。
- README 和其他由 GitHub 轉譯的文件應保留絕對文件 URL，讓連結在 Mintlify 之外也能運作。
- 文件內容必須保持通用：不要包含個人裝置名稱、主機名稱或本機路徑；使用像 `user@gateway-host` 這類佔位符。

## 文件內容規則

- 對於文件、使用者介面文案和選擇器清單，除非章節明確描述執行階段順序或自動偵測順序，否則服務/提供者應按字母順序排列。
- 保持 bundled 外掛命名與根 `AGENTS.md` 中全儲存庫的外掛術語規則一致。

## 內部文件

- 長期保留的私人操作員文件應放在 `~/Projects/manager/docs/`。
- 儲存庫本機的內部暫存/鏡像文件可放在已忽略的 `docs/internal/` 下。
- 絕不要將 `docs/internal/**` 頁面加入 `docs/docs.json` 導覽，或從公開文件連結到它們。
- 如果之後強制新增頁面，`scripts/docs-sync-publish.mjs` 會從公開的 `openclaw/docs` 發布儲存庫排除並修剪 `docs/internal/**`。
- 內部文件可以提及儲存庫路徑、私人應用程式名稱、1Password 項目名稱和執行手冊，但絕不能包含秘密值。

## 成熟度計分卡編輯

`taxonomy.yaml` 和 `qa/maturity-scores.yaml` 是來源輸入；`docs/maturity/` 下產生的成熟度文件是投影，不應手動編輯分數、LTS、分類法、QA 設定檔或證據表格。
`scripts/qa/render-maturity-docs.ts` 負責產生；使用 `pnpm maturity:render` 重新整理已提交的文件，並使用 `pnpm maturity:check` 驗證它們。
`.github/workflows/maturity-scorecard.yml` 會轉譯成品預覽，並可開啟產生文件的 PR；`.github/workflows/openclaw-release-checks.yml` 會為發布 QA 分派它。
除非維護者明確要求提交經過清理的投影，否則請將確定性的 `qa-evidence.json.scorecard` 資料保留在 GitHub Actions 成品中。
人工覆寫必須在 PR 中變更來源狀態，並說明原因以及公開或已遮蔽的證據。

## 文件 i18n

- 此儲存庫不維護外語文件。產生的發布輸出位於獨立的 `openclaw/docs` 儲存庫（本機通常複製為 `../openclaw-docs`）。
- 不要在此處的 `docs/<locale>/**` 下新增或編輯本地化文件。
- 將此儲存庫中的英文文件加上詞彙表檔案視為真實來源。
- 管線：在此處更新英文文件，視需要更新 `docs/.i18n/glossary.<locale>.json`，然後讓發布儲存庫同步並在 `openclaw/docs` 中執行 `scripts/docs-i18n`。
- 重新執行 `scripts/docs-i18n` 前，請為任何必須保持英文或使用固定翻譯的新技術術語、頁面標題或短導覽標籤新增詞彙表項目。
- `pnpm docs:check-i18n-glossary` 是已變更英文文件標題和短內部文件標籤的防護。
- 翻譯記憶位於發布儲存庫中產生的 `docs/.i18n/*.tm.jsonl` 檔案。
- 請參閱 `docs/.i18n/README.md`。
