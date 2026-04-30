---
read_when:
    - 從儲存庫執行指令碼
    - 新增或變更 ./scripts 下的指令碼
summary: 存放庫指令碼：目的、範圍與安全注意事項
title: 指令碼
x-i18n:
    generated_at: "2026-04-30T03:11:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` 目錄包含用於本機工作流程與維運工作的輔助腳本。
當工作明確與腳本相關時使用這些腳本；否則請優先使用 CLI。

## 慣例

- 除非文件或發行檢查清單中有引用，否則腳本皆為**選用**。
- 當 CLI 介面存在時，請優先使用 CLI 介面（範例：驗證監控使用 `openclaw models status --check`）。
- 假設腳本具有主機特定性；在新機器上執行前請先閱讀。

## 驗證監控腳本

驗證監控涵蓋於[驗證](/zh-TW/gateway/authentication)。`scripts/` 下的腳本是 systemd/Termux 手機工作流程的選用額外工具。

## GitHub 讀取輔助工具

當你希望 `gh` 使用 GitHub App 安裝權杖進行儲存庫範圍的讀取呼叫，同時讓一般 `gh` 保持使用你的個人登入以執行寫入動作時，請使用 `scripts/gh-read`。

必要環境變數：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

選用環境變數：

- `OPENCLAW_GH_READ_INSTALLATION_ID`，當你想略過以儲存庫為基礎的安裝查詢時使用
- `OPENCLAW_GH_READ_PERMISSIONS`，作為要請求之讀取權限子集的逗號分隔覆寫值

儲存庫解析順序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

範例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 新增腳本時

- 保持腳本聚焦且有文件說明。
- 在相關文件中新增一則簡短項目（若缺少則建立一份）。

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
