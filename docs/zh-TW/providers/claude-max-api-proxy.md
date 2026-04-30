---
read_when:
    - 你想要搭配 OpenAI 相容工具使用 Claude Max 訂閱
    - 你想要一個封裝 Claude Code CLI 的本機 API 伺服器
    - 你想評估以訂閱為基礎與以 API 金鑰為基礎的 Anthropic 存取方式
summary: 社群代理，用於將 Claude 訂閱憑證公開為 OpenAI 相容端點
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-04-30T03:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一個社群工具，可將你的 Claude Max/Pro 訂閱公開為 OpenAI 相容的 API 端點。這讓你能在任何支援 OpenAI API 格式的工具中使用你的訂閱。

<Warning>
此路徑僅用於技術相容性。Anthropic 過去曾封鎖部分在 Claude Code 之外的訂閱
使用方式。你必須自行決定是否使用它，並在依賴它之前確認 Anthropic 目前的條款。
</Warning>

## 為什麼使用這個？

| 做法                    | 成本                                                | 最適合                                   |
| ----------------------- | --------------------------------------------------- | ---------------------------------------- |
| Anthropic API           | 按 token 付費（Opus 約 $15/M 輸入、$75/M 輸出）     | 生產應用程式、高用量                     |
| Claude Max 訂閱         | 每月固定 $200                                      | 個人使用、開發、無限制使用               |

如果你有 Claude Max 訂閱，並想搭配 OpenAI 相容工具使用，這個代理可能會降低某些工作流程的成本。對於生產用途，API 金鑰仍是政策上更清楚的路徑。

## 運作方式

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

此代理：

1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式的請求
2. 將它們轉換為 Claude Code CLI 命令
3. 以 OpenAI 格式回傳回應（支援串流）

## 開始使用

<Steps>
  <Step title="Install the proxy">
    需要 Node.js 20+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    將 OpenClaw 指向此代理，作為自訂 OpenAI 相容端點：

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 內建目錄

| Model ID          | 對應至          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 進階設定

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    此路徑使用與其他自訂 `/v1` 後端相同的代理式 OpenAI 相容路由：

    - 不套用原生僅限 OpenAI 的請求塑形
    - 沒有 `service_tier`、沒有 Responses `store`、沒有提示快取提示，也沒有
      OpenAI reasoning 相容酬載塑形
    - 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
      不會注入到代理 URL 上

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    建立 LaunchAgent 以自動執行此代理：

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## 連結

- **npm：** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub：** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues：** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 備註

- 這是一個**社群工具**，並非由 Anthropic 或 OpenClaw 官方支援
- 需要有效的 Claude Max/Pro 訂閱，且 Claude Code CLI 已完成驗證
- 此代理在本機執行，不會將資料傳送到任何第三方伺服器
- 完整支援串流回應

<Note>
若要使用 Claude CLI 或 API 金鑰進行原生 Anthropic 整合，請參閱 [Anthropic provider](/zh-TW/providers/anthropic)。若要使用 OpenAI/Codex 訂閱，請參閱 [OpenAI provider](/zh-TW/providers/openai)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/zh-TW/providers/anthropic" icon="bolt">
    透過 Claude CLI 或 API 金鑰與 OpenClaw 原生整合。
  </Card>
  <Card title="OpenAI provider" href="/zh-TW/providers/openai" icon="robot">
    適用於 OpenAI/Codex 訂閱。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
