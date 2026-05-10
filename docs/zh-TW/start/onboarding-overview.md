---
read_when:
    - 選擇入門路徑
    - 設定新環境
sidebarTitle: Onboarding Overview
summary: OpenClaw 入門設定選項與流程概覽
title: 入門概覽
x-i18n:
    generated_at: "2026-05-10T19:51:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有兩種上手設定路徑。兩者都會設定驗證、Gateway，以及
可選的聊天頻道，只是與設定流程互動的方式不同。

## 我應該使用哪一種路徑？

|                | CLI 上手設定                         | macOS app 上手設定      |
| -------------- | -------------------------------------- | ------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 僅限 macOS                |
| **介面**  | 終端機精靈                        | app 中的引導式 UI      |
| **最適合**   | 伺服器、無頭環境、完整控制        | 桌面 Mac、視覺化設定 |
| **自動化** | `--non-interactive` 用於腳本        | 僅限手動               |
| **命令**    | `openclaw onboard`                     | 啟動 app            |

大多數使用者應該從 **CLI 上手設定** 開始，因為它可在各處運作，並給予
你最多控制權。

## 上手設定會設定什麼

無論你選擇哪一種路徑，上手設定都會設定：

1. **模型提供者與驗證** — 你所選提供者的 API 金鑰、OAuth 或設定權杖
2. **工作區** — 代理檔案、啟動範本與記憶的目錄
3. **Gateway** — 連接埠、繫結位址、驗證模式
4. **頻道**（可選）— 內建與隨附的聊天頻道，例如
   iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守護程式**（可選）— 背景服務，讓 Gateway 自動啟動

## CLI 上手設定

在任何終端機中執行：

```bash
openclaw onboard
```

加入 `--install-daemon`，即可在同一步驟中一併安裝背景服務。

完整參考：[上手設定（CLI）](/zh-TW/start/wizard)
CLI 命令文件：[`openclaw onboard`](/zh-TW/cli/onboard)

## macOS app 上手設定

開啟 OpenClaw app。首次執行精靈會透過視覺化介面引導你完成相同步驟。

完整參考：[上手設定（macOS App）](/zh-TW/start/onboarding)

## 自訂或未列出的提供者

如果你的提供者未列於上手設定中，請選擇 **自訂提供者** 並輸入：

- API 相容模式（OpenAI 相容、Anthropic 相容，或自動偵測）
- Base URL 與 API 金鑰
- Model ID 與可選別名

可以同時存在多個自訂端點，每個端點都會取得自己的端點 ID。

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [CLI 設定參考](/zh-TW/start/wizard-cli-reference)
