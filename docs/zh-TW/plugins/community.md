---
read_when:
    - 您想尋找第三方 OpenClaw Plugin
    - 你想要發布或列出自己的 Plugin
summary: 由社群維護的 OpenClaw Plugin：瀏覽、安裝並提交您自己的 Plugin
title: 社群 Plugin
x-i18n:
    generated_at: "2026-04-30T09:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

社群 Plugin 是第三方套件，可透過新的
頻道、工具、提供者或其他功能擴充 OpenClaw。它們由社群建置和維護，
通常發布在 [ClawHub](/zh-TW/tools/clawhub)，並可用單一指令安裝。對於尚未
移至 ClawHub 的套件，npm 仍是支援的備用選項。

ClawHub 是社群 Plugin 的標準探索介面。不要只是為了讓你的 Plugin 更容易被發現，
就開啟僅限文件的 PR 來把它加入這裡；請改為將它發布到
ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 會先檢查 ClawHub，並自動退回使用 npm。

## 已列出的 Plugin

### Apify

使用 20,000 多個現成的爬蟲，從任何網站擷取資料。只要提出要求，就能讓你的代理
從 Instagram、Facebook、TikTok、YouTube、Google Maps、Google
Search、電子商務網站等擷取資料。

- **npm：** `@apify/apify-openclaw-plugin`
- **儲存庫：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用於 Codex App Server 對話的獨立 OpenClaw 橋接器。將聊天綁定到
Codex thread，以純文字與其對話，並用聊天原生
指令控制恢復、規劃、審查、模型選擇、壓縮等功能。

- **npm：** `openclaw-codex-app-server`
- **儲存庫：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企業機器人整合。支援透過任何 DingTalk 用戶端傳送文字、圖片和
檔案訊息。

- **npm：** `@largezhou/ddingtalk`
- **儲存庫：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 的無損上下文管理 Plugin。以 DAG 為基礎的對話
摘要，搭配增量壓縮，在降低 token 使用量的同時
保留完整的上下文精確度。

- **npm：** `@martian-engineering/lossless-claw`
- **儲存庫：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

將代理 trace 匯出到 Opik 的官方 Plugin。監控代理行為、
成本、token、錯誤等。

- **npm：** `@opik/opik-openclaw`
- **儲存庫：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

為你的 OpenClaw 代理提供具備即時對嘴、情緒
表情和文字轉語音的 Live2D avatar。包含用於 AI 資產生成
和一鍵部署到 Prometheus Marketplace 的創作者工具。目前處於 alpha。

- **npm：** `@prometheusavatar/openclaw-plugin`
- **儲存庫：** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

透過 QQ Bot API 將 OpenClaw 連接到 QQ。支援私人聊天、群組
提及、頻道訊息，以及包含語音、圖片、影片
和檔案的豐富媒體。

目前的 OpenClaw 發行版本已內建 QQ Bot。一般安裝請使用
[QQ Bot](/zh-TW/channels/qqbot) 中的內建設定；只有在你刻意想使用騰訊維護的獨立套件時，
才安裝此外部 Plugin。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **儲存庫：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

騰訊 WeCom 團隊為 OpenClaw 提供的 WeCom 頻道 Plugin。由
WeCom Bot WebSocket 持久連線驅動，支援私訊和群組
聊天、串流回覆、主動訊息、圖片/檔案處理、Markdown
格式化、內建存取控制，以及文件/會議/訊息 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **儲存庫：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

騰訊 Yuanbao 團隊為 OpenClaw 提供的 Yuanbao 頻道 Plugin。由
WebSocket 持久連線驅動，支援私訊和群組聊天、
串流回覆、主動訊息、圖片/檔案/音訊/影片處理、
Markdown 格式化、內建存取控制，以及 slash-command 選單。

- **npm：** `openclaw-plugin-yuanbao`
- **儲存庫：** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的 Plugin

我們歡迎有用、文件完整且操作安全的社群 Plugin。

<Steps>
  <Step title="發布到 ClawHub 或 npm">
    你的 Plugin 必須可透過 `openclaw plugins install \<package-name\>` 安裝。
    除非你特別需要僅透過 npm
    發行，否則請發布到 [ClawHub](/zh-TW/tools/clawhub)。
    完整指南請參閱[建置 Plugin](/zh-TW/plugins/building-plugins)。

  </Step>

  <Step title="託管在 GitHub">
    原始碼必須位於公開儲存庫，並包含設定文件和 issue
    tracker。

  </Step>

  <Step title="僅將文件 PR 用於來源文件變更">
    你不需要只為了讓 Plugin 可被發現而提交文件 PR。請改為將它發布到
    ClawHub。

    只有在 OpenClaw 的來源文件需要實際內容
    變更時，才開啟文件 PR，例如修正安裝指引，或新增屬於主要文件集的跨儲存庫
    文件。

  </Step>
</Steps>

## 品質門檻

| 要求                        | 原因                                          |
| --------------------------- | --------------------------------------------- |
| 發布在 ClawHub 或 npm       | 使用者需要 `openclaw plugins install` 可正常運作 |
| 公開 GitHub 儲存庫          | 原始碼審查、issue 追蹤、透明度               |
| 設定與使用文件              | 使用者需要知道如何設定它                     |
| 積極維護                    | 近期更新或回應式 issue 處理                  |

低投入的包裝器、所有權不清楚或未維護的套件可能會被拒絕。

## 相關

- [安裝和設定 Plugin](/zh-TW/tools/plugin) — 如何安裝任何 Plugin
- [建置 Plugin](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin Manifest](/zh-TW/plugins/manifest) — manifest 結構描述
