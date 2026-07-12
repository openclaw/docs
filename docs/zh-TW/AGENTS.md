---
x-i18n:
    generated_at: "2026-07-11T21:06:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# 文件指南

此目錄負責文件撰寫、Mintlify 連結規則與文件國際化政策。

## Mintlify 規則

- 文件託管於 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的內部文件連結必須維持根目錄相對路徑，且不得包含 `.md` 或 `.mdx` 副檔名（例如：`[設定](/gateway/configuration)`）。
- 章節交叉參照應在根目錄相對路徑上使用錨點（例如：`[鉤子](/gateway/configuration-reference#hooks)`）。
- 文件標題應避免使用長破折號與撇號，因為 Mintlify 的錨點產生機制在處理這些字元時不穩定。
- README 與其他由 GitHub 算繪的文件應保留絕對文件 URL，確保連結在 Mintlify 之外也能運作。
- 文件內容必須保持通用：不得包含個人裝置名稱、主機名稱或本機路徑；請使用 `user@gateway-host` 等預留位置。

## 文件內容規則

- 文件、使用者介面文案與選擇器清單中的服務／提供者應依字母順序排列，除非該章節明確描述執行階段順序或自動偵測順序。
- 內建外掛的命名應與根目錄 `AGENTS.md` 中適用於整個儲存庫的外掛術語規則保持一致。
- 以下為產生的文件，切勿手動編輯：`docs/plugins/reference/**`、`docs/plugins/reference.md` 與 `docs/plugins/plugin-inventory.md` 由 `pnpm plugins:inventory:gen` 產生；`docs/docs_map.md` 由 `pnpm docs:map:gen` 產生；`docs/maturity/**` 由 `pnpm maturity:render` 產生。

## 內部文件

- 長期維護的私人操作人員文件應放在 `~/Projects/manager/docs/`。
- 儲存庫本機的內部暫存／鏡像文件可放在已忽略的 `docs/internal/` 下。
- 絕不可將 `docs/internal/**` 頁面加入 `docs/docs.json` 導覽，也不可從公開文件連結至這些頁面。
- 若頁面之後被強制加入，`scripts/docs-sync-publish.mjs` 會從公開的 `openclaw/docs` 發布儲存庫中排除並清除 `docs/internal/**`。
- 內部文件可提及儲存庫路徑、私人應用程式名稱、1Password 項目名稱與操作手冊，但絕不可包含機密值。

## 成熟度評分卡編輯

`taxonomy.yaml` 與 `qa/maturity-scores.yaml` 是來源輸入；`docs/maturity/` 下產生的成熟度文件是投影內容，不應手動編輯其中的分數、LTS、分類法、QA 設定檔或證據表格。
`scripts/qa/render-maturity-docs.ts` 負責產生作業；使用 `pnpm maturity:render` 重新整理已提交的文件，並使用 `pnpm maturity:check` 驗證。
`.github/workflows/maturity-scorecard.yml` 會算繪成品預覽，並可開啟產生文件的 PR；`.github/workflows/openclaw-release-checks.yml` 會為發布 QA 分派該工作流程。
除非維護者明確要求提交經過淨化的投影，否則請將確定性的 `qa-evidence.json.scorecard` 資料保留在 GitHub Actions 成品中。
人工覆寫必須透過 PR 變更來源狀態，並說明原因及提供公開或經過遮蔽的證據。

## 文件國際化

- 此儲存庫不維護外語文件。產生的發布輸出位於獨立的 `openclaw/docs` 儲存庫中（通常在本機複製為 `../openclaw-docs`）。
- 請勿在此處的 `docs/<locale>/**` 下新增或編輯本地化文件。
- 以此儲存庫中的英文文件及詞彙表檔案作為唯一事實來源。
- 流程：在此處更新英文文件、視需要更新 `docs/.i18n/glossary.<locale>.json`，接著讓發布儲存庫進行同步，並在 `openclaw/docs` 中執行 `scripts/docs-i18n`。
- 重新執行 `scripts/docs-i18n` 前，請為所有必須保留英文或採用固定翻譯的新技術術語、頁面標題或簡短導覽標籤新增詞彙表項目。
- `pnpm docs:check-i18n-glossary` 是針對已變更英文文件標題與簡短內部文件標籤的防護檢查。
- 翻譯記憶位於發布儲存庫中產生的 `docs/.i18n/*.tm.jsonl` 檔案。
- 請參閱 `docs/.i18n/README.md`。
