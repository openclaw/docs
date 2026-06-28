---
read_when:
    - 從儲存庫執行指令碼
    - 新增或變更 ./scripts 下的指令碼
summary: 儲存庫指令碼：用途、範圍與安全注意事項
title: 指令碼
x-i18n:
    generated_at: "2026-05-06T09:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`scripts/` 目錄包含用於本機工作流程和維運工作的輔助指令碼。
當工作明確與某個指令碼相關時，請使用這些指令碼；否則優先使用 CLI。

## 慣例

- 除非文件或發布檢查清單中有引用，否則指令碼都是**選用**的。
- 有 CLI 介面時，請優先使用 CLI 介面（範例：身分驗證監控使用 `openclaw models status --check`）。
- 假設指令碼與主機相關；在新機器上執行前請先閱讀它們。

## 身分驗證監控指令碼

身分驗證監控涵蓋於[身分驗證](/zh-TW/gateway/authentication)。`scripts/` 下的指令碼是 systemd/Termux 手機工作流程的選用額外工具。

## GitHub 讀取輔助工具

當你希望 `gh` 使用 GitHub App 安裝權杖來進行儲存庫範圍的讀取呼叫，同時保留一般 `gh` 使用你的個人登入來執行寫入動作時，請使用 `scripts/gh-read`。

必要環境變數：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

選用環境變數：

- 當你想跳過以儲存庫為基礎的安裝查詢時，使用 `OPENCLAW_GH_READ_INSTALLATION_ID`
- `OPENCLAW_GH_READ_PERMISSIONS` 作為要請求之讀取權限子集的逗號分隔覆寫值

儲存庫解析順序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

範例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 新增指令碼時

- 保持指令碼聚焦且有文件說明。
- 在相關文件中新增一則簡短項目（若缺少則建立一份）。

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
