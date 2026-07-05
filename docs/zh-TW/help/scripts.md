---
read_when:
    - 從 repo 執行指令碼
    - 新增或變更 ./scripts 下的指令碼
summary: 儲存庫指令碼：用途、範圍與安全注意事項
title: 腳本
x-i18n:
    generated_at: "2026-07-05T11:21:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` 包含用於本機工作流程與維運任務的輔助指令碼。當任務明確與某個指令碼相關時使用它們；否則優先使用命令列介面。

## 慣例

- 除非文件或發行檢查清單中有引用，否則指令碼皆為**選用**。
- 若命令列介面介面存在，請優先使用（範例：`openclaw models status --check`）。
- 假設指令碼與主機環境相關；在新機器上執行前請先閱讀它們。

## 驗證監控指令碼

一般模型驗證已在[驗證](/zh-TW/gateway/authentication)中說明。以下指令碼是一套獨立的選用系統，用於在遠端/無頭主機上監控 **Claude Code 命令列介面訂閱權杖**，並從手機重新驗證：

- `scripts/setup-auth-system.sh` - 一次性設定：檢查目前驗證、協助產生長效的 `claude setup-token`，並列印 systemd/Termux 安裝步驟。
- `scripts/claude-auth-status.sh [full|json|simple]` - 檢查 Claude Code + OpenClaw 驗證狀態。
- `scripts/auth-monitor.sh` - 輪詢狀態，並在權杖接近到期時傳送通知（透過 OpenClaw send，及/或 ntfy.sh）。環境變數：`WARN_HOURS`（預設 `2`）、`NOTIFY_PHONE`、`NOTIFY_NTFY`。透過隨附的 `scripts/systemd/openclaw-auth-monitor.{service,timer}` 依排程執行（每 30 分鐘）。
- `scripts/mobile-reauth.sh` - 重新執行 `claude setup-token`，並列印要在手機上開啟的 URL，供從 Termux 透過 SSH 使用。
- `scripts/termux-quick-auth.sh`、`scripts/termux-auth-widget.sh`、`scripts/termux-sync-widget.sh` - Termux:Widget 指令碼，會透過 SSH 連到主機、顯示狀態 toast，並在驗證過期時開啟重新驗證主控台/指示。

## GitHub 讀取輔助工具

當你希望 `gh` 對儲存庫範圍的讀取呼叫使用 GitHub App 安裝權杖，同時讓一般 `gh` 保持使用你的個人登入來執行寫入動作時，請使用 `scripts/gh-read`。

必要環境變數：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

選用環境變數：

- `OPENCLAW_GH_READ_INSTALLATION_ID`，當你想略過以儲存庫為基礎的安裝查找時使用
- `OPENCLAW_GH_READ_PERMISSIONS`，作為要請求之讀取權限子集的逗號分隔覆寫值

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
- 在相關文件中新增一則簡短條目（若缺少則建立一份）。

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
