---
read_when:
    - 選擇入門路徑
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 入門設定選項與流程概覽
title: 入門流程概覽
x-i18n:
    generated_at: "2026-04-30T03:40:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有兩種入門設定路徑。兩者都會設定驗證、Gateway，以及
選用的聊天頻道，差別只在於你與設定流程互動的方式。

## 我應該使用哪一種路徑？

|                | CLI 入門設定                         | macOS 應用程式入門設定      |
| -------------- | -------------------------------------- | ------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 僅限 macOS                |
| **介面**  | 終端機精靈                        | 應用程式內的引導式 UI      |
| **最適合**   | 伺服器、無頭環境、完整控制        | 桌面 Mac、視覺化設定 |
| **自動化** | 用於指令碼的 `--non-interactive`        | 僅限手動               |
| **命令**    | `openclaw onboard`                     | 啟動應用程式            |

大多數使用者應該從 **CLI 入門設定**開始，因為它可在各處運作，並提供
最多控制權。

## 入門設定會設定什麼

無論你選擇哪一種路徑，入門設定都會設定：

1. **模型提供者與驗證** — 你所選提供者的 API 金鑰、OAuth 或設定權杖
2. **工作區** — 用於代理程式檔案、啟動範本和記憶體的目錄
3. **Gateway** — 連接埠、繫結位址、驗證模式
4. **頻道**（選用）— 內建與隨附的聊天頻道，例如
   BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守護程式**（選用）— 背景服務，讓 Gateway 自動啟動

## CLI 入門設定

在任何終端機中執行：

```bash
openclaw onboard
```

加上 `--install-daemon`，即可在同一步驟中一併安裝背景服務。

完整參考：[入門設定（CLI）](/zh-TW/start/wizard)
CLI 命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS 應用程式入門設定

開啟 OpenClaw 應用程式。首次執行精靈會透過視覺化介面引導你完成相同步驟。

完整參考：[入門設定（macOS 應用程式）](/zh-TW/start/onboarding)

## 自訂或未列出的提供者

如果你的提供者未列在入門設定中，請選擇 **自訂提供者** 並輸入：

- API 相容模式（OpenAI 相容、Anthropic 相容，或自動偵測）
- 基礎 URL 和 API 金鑰
- 模型 ID 和選用別名

多個自訂端點可以共存，每個端點都會取得自己的端點 ID。

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [CLI 設定參考](/zh-TW/start/wizard-cli-reference)
