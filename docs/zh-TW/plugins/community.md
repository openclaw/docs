---
read_when:
    - 您想尋找第三方 OpenClaw Plugin
    - 你想發布或列出自己的 Plugin
summary: 社群維護的 OpenClaw Plugin：瀏覽、安裝並提交自己的 Plugin
title: 社群 Plugin
x-i18n:
    generated_at: "2026-05-02T20:51:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Community Plugins 是由第三方套件，用新的 channels、tools、providers 或其他能力擴充 OpenClaw。它們由社群建置與維護，通常發佈在 [ClawHub](/zh-TW/tools/clawhub)，並且可用單一命令安裝。Npm 仍是裸 package specs 的預設啟動來源，而 ClawHub pack 安裝正在逐步推出。

ClawHub 是社群 Plugins 的標準探索介面。不要只是為了讓你的 Plugin 更容易被發現而開啟純文件 PR；請改為將它發佈到 ClawHub。

```bash
openclaw plugins install clawhub:<package-name>
```

針對 npm 託管的套件，請使用 `openclaw plugins install <package-name>`。

## 已列出的 Plugins

### Apify

使用 20,000 多個現成爬蟲從任何網站擷取資料。讓你的 agent 只要透過提問，就能從 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、電子商務網站等來源擷取資料。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用於 Codex App Server 對話的獨立 OpenClaw 橋接器。將聊天綁定到 Codex thread、用純文字與它交談，並使用聊天原生命令控制 resume、planning、review、model selection、compaction 等功能。

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

OpenClaw 的無損情境管理 Plugin。基於 DAG 的對話摘要搭配增量 Compaction，在降低 token 使用量的同時保留完整情境保真度。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

將 agent traces 匯出到 Opik 的官方 Plugin。監控 agent 行為、成本、tokens、錯誤等資訊。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

為你的 OpenClaw agent 提供具備即時對嘴、情緒表情與文字轉語音的 Live2D avatar。包含用於 AI 資產生成的創作者工具，以及一鍵部署到 Prometheus Marketplace。目前處於 alpha 階段。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

透過 QQ Bot API 將 OpenClaw 連接到 QQ。支援私人聊天、群組提及、頻道訊息，以及包含語音、圖片、影片與檔案的 rich media。

目前的 OpenClaw 版本已內建 QQ Bot。一般安裝請使用 [QQ Bot](/zh-TW/channels/qqbot) 中的內建設定；只有在你明確想使用 Tencent 維護的獨立套件時，才安裝這個外部 Plugin。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由 Tencent WeCom 團隊提供的 OpenClaw WeCom channel Plugin。它由 WeCom Bot WebSocket 持久連線驅動，支援直接訊息與群組聊天、串流回覆、主動訊息、圖片/檔案處理、Markdown 格式、內建存取控制，以及文件/會議/訊息 Skills。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

由 Tencent Yuanbao 團隊提供的 OpenClaw Yuanbao channel Plugin。它由 WebSocket 持久連線驅動，支援直接訊息與群組聊天、串流回覆、主動訊息、圖片/檔案/音訊/影片處理、Markdown 格式、內建存取控制，以及斜線命令選單。

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 提交你的 Plugin

我們歡迎實用、有文件且操作安全的社群 Plugins。

<Steps>
  <Step title="發佈到 ClawHub 或 npm">
    你的 Plugin 必須可透過 `openclaw plugins install \<package-name\>` 安裝。
    除非你特別需要僅透過 npm 發佈，否則請發佈到 [ClawHub](/zh-TW/tools/clawhub)。
    完整指南請參閱 [建置 Plugins](/zh-TW/plugins/building-plugins)。

  </Step>

  <Step title="託管在 GitHub">
    原始碼必須位於公開 repository，並包含設定文件與 issue tracker。

  </Step>

  <Step title="僅將 docs PR 用於來源文件變更">
    你不需要只是為了讓 Plugin 更容易被發現而提交 docs PR。請改為將它發佈在 ClawHub。

    只有在 OpenClaw 的來源文件需要實際內容變更時，才開啟 docs PR，例如修正安裝指引，或新增屬於主要文件集的跨 repository 文件。

  </Step>
</Steps>

## 品質門檻

| 要求                        | 原因                                          |
| --------------------------- | --------------------------------------------- |
| 發佈在 ClawHub 或 npm       | 使用者需要 `openclaw plugins install` 可正常運作 |
| 公開 GitHub repository      | 原始碼審查、issue tracking、透明度            |
| 設定與使用文件              | 使用者需要知道如何設定它                      |
| 積極維護                    | 近期更新或回應式 issue 處理                   |

低投入 wrappers、所有權不明確，或未維護的套件可能會被拒絕。

## 相關

- [安裝與設定 Plugins](/zh-TW/tools/plugin) — 如何安裝任何 Plugin
- [建置 Plugins](/zh-TW/plugins/building-plugins) — 建立你自己的 Plugin
- [Plugin Manifest](/zh-TW/plugins/manifest) — manifest schema
