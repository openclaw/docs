---
read_when:
    - 您想尋找第三方 OpenClaw Plugin
    - 你想發布或列出自己的 Plugin
summary: 社群維護的 OpenClaw Plugin：瀏覽、安裝並提交自己的 Plugin
title: 社群 Plugin
x-i18n:
    generated_at: "2026-04-30T03:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

社群 Plugin 是第三方套件，可透過新的通道、工具、供應器或其他能力來擴充 OpenClaw。它們由社群建置與維護，通常發布在 [ClawHub](/zh-TW/tools/clawhub)，並可用單一命令安裝。對於尚未移轉到 ClawHub 的套件，npm 仍然是支援的備用選項。

ClawHub 是社群 Plugin 的標準探索介面。不要只為了讓你的 Plugin 更容易被找到而開啟僅限文件的 PR；請改為將它發布到 ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 會先檢查 ClawHub，並自動 fallback 到 npm。

## 列出的 Plugin

### Apify

使用 20,000 多個現成 scraper 從任何網站擷取資料。讓你的代理程式只需提出要求，就能從 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、電子商務網站等來源擷取資料。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用於 Codex App Server 對話的獨立 OpenClaw 橋接器。將聊天繫結到 Codex 執行緒，以純文字與它對話，並使用聊天原生命令控制恢復、規劃、審查、模型選擇、Compaction 等功能。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企業機器人整合。透過任何 DingTalk 用戶端支援文字、圖片與檔案訊息。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 的 Lossless Context Management Plugin。以 DAG 為基礎的對話摘要，搭配增量式 Compaction，在降低 token 使用量的同時保留完整上下文保真度。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

將代理程式 trace 匯出到 Opik 的官方 Plugin。監控代理程式行為、成本、token、錯誤等資訊。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

為你的 OpenClaw 代理程式提供具備即時唇形同步、情緒表情與文字轉語音的 Live2D avatar。包含用於 AI 資產產生與一鍵部署到 Prometheus Marketplace 的創作者工具。目前處於 alpha 階段。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

透過 QQ Bot API 將 OpenClaw 連接到 QQ。支援私人聊天、群組提及、頻道訊息，以及包含語音、圖片、影片和檔案的豐富媒體。

目前的 OpenClaw 版本內建 QQ Bot。一般安裝請使用 [QQ Bot](/zh-TW/channels/qqbot) 中的內建設定；只有在你明確想使用 Tencent 維護的獨立套件時，才安裝此外部 Plugin。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由 Tencent WeCom 團隊為 OpenClaw 提供的 WeCom 通道 Plugin。它由 WeCom Bot WebSocket 持久連線驅動，支援直接訊息與群組聊天、串流回覆、主動訊息、圖片/檔案處理、Markdown 格式化、內建存取控制，以及文件/會議/訊息 Skills。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

由 Tencent Yuanbao 團隊為 OpenClaw 提供的 Yuanbao 通道 Plugin。它由 WebSocket 持久連線驅動，支援直接訊息與群組聊天、串流回覆、主動訊息、圖片/檔案/音訊/影片處理、Markdown 格式化、內建存取控制，以及斜線命令選單。

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的 Plugin

我們歡迎實用、有文件且操作安全的社群 Plugin。

<Steps>
  <Step title="發布到 ClawHub 或 npm">
    你的 Plugin 必須能透過 `openclaw plugins install \<package-name\>` 安裝。
    除非你特別需要僅透過 npm 發布，否則請發布到 [ClawHub](/zh-TW/tools/clawhub)。
    完整指南請參閱 [建置 Plugin](/zh-TW/plugins/building-plugins)。

  </Step>

  <Step title="託管於 GitHub">
    原始碼必須位於公開儲存庫，並包含設定文件與 issue
    追蹤器。

  </Step>

  <Step title="僅將文件 PR 用於來源文件變更">
    你不需要只為了讓你的 Plugin 可被探索而開文件 PR。請改為將它發布到
    ClawHub。

    只有在 OpenClaw 的來源文件需要實際內容
    變更時才開文件 PR，例如修正安裝指引或新增屬於主要文件集的跨儲存庫
    文件。

  </Step>
</Steps>

## 品質門檻

| 要求                        | 原因                                           |
| --------------------------- | --------------------------------------------- |
| 發布在 ClawHub 或 npm       | 使用者需要 `openclaw plugins install` 可正常運作 |
| 公開 GitHub 儲存庫          | 原始碼審查、issue 追蹤、透明度               |
| 設定與使用文件              | 使用者需要知道如何設定它                      |
| 主動維護                    | 近期更新或回應式 issue 處理                  |

低投入包裝、所有權不明或未維護的套件可能會被拒絕。

## 相關

- [安裝與設定 Plugin](/zh-TW/tools/plugin) — 如何安裝任何 Plugin
- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin Manifest](/zh-TW/plugins/manifest) — manifest 結構描述
