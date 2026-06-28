---
read_when:
    - 你想將 Claude Max 訂閱搭配 OpenAI 相容工具使用
    - 你想要一個封裝 Claude Code 命令列介面的本機 API 伺服器
    - 你想評估訂閱制與 API 金鑰制的 Anthropic 存取方式
summary: 社群代理，用於將 Claude 訂閱憑證公開為 OpenAI 相容端點
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-06-28T20:44:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一個社群工具，可將你的 Claude Max/Pro 訂閱公開為 OpenAI 相容的 API 端點。這讓你能將訂閱用於任何支援 OpenAI API 格式的工具。

<Warning>
此路徑僅屬於技術相容性。Anthropic 過去曾封鎖 Claude Code 以外的部分訂閱
使用方式。你必須自行決定是否使用
它，並在依賴它之前確認 Anthropic 目前的計費規則。

Anthropic 目前的支援文件指出 `claude -p` 屬於 Agent SDK/程式化使用方式。
Anthropic 於 2026 年 6 月 15 日的支援更新暫停了先前宣布的獨立 Agent SDK
額度方案。目前，Claude Agent SDK、`claude -p` 與第三方應用程式使用方式
仍會計入已登入訂閱的使用限制。

在依賴此路徑之前，請查看 Anthropic 的 [Agent SDK 方案
文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)，
以及適用於
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
或
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
帳戶的 Claude Code 支援文章。
</Warning>

## 為什麼使用這個？

| 方法                      | 成本路徑                                        | 最適合                                   |
| ------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Anthropic API             | 透過 Claude Console 或雲端依 token 付費         | 生產應用程式、共享自動化、大量使用       |
| Claude 訂閱代理           | Claude Code / `claude -p` 方案與額度規則        | 搭配相容工具進行個人實驗                 |

如果你有 Claude Max 或 Pro 訂閱，並希望將它與
OpenAI 相容工具搭配使用，這個代理可能適合某些個人工作流程。這不是
無限制的固定費率路徑。對於
生產用途，API 金鑰仍是政策與計費上更清楚的路徑。

## 運作方式

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

此代理會：

1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式的請求
2. 將它們轉換為 Claude Code CLI 命令
3. 以 OpenAI 格式傳回回應（支援串流）

## 開始使用

<Steps>
  <Step title="安裝代理">
    需要 Node.js 22+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="啟動伺服器">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="測試代理">
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
  <Step title="設定 OpenClaw">
    將 OpenClaw 指向此代理，作為自訂的 OpenAI 相容端點：

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

| 模型 ID           | 對應至          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 進階設定

<AccordionGroup>
  <Accordion title="代理式 OpenAI 相容注意事項">
    此路徑使用與其他自訂
    `/v1` 後端相同的代理式 OpenAI 相容路由：

    - 不適用原生 OpenAI 專用的請求塑形
    - 沒有 `service_tier`、沒有 Responses `store`、沒有提示快取提示，也沒有
      OpenAI 推理相容酬載塑形
    - 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
      不會注入到代理 URL

  </Accordion>

  <Accordion title="在 macOS 上使用 LaunchAgent 自動啟動">
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

## 注意事項

- 這是**社群工具**，並非由 Anthropic 或 OpenClaw 官方支援
- 需要有效的 Claude Max/Pro 訂閱，且已完成 Claude Code CLI 驗證
- 繼承 Claude Code `claude -p` 的計費、使用額度與速率限制行為
- 此代理在本機執行，不會將資料傳送到任何第三方伺服器
- 完整支援串流回應

<Note>
若要使用 Claude CLI 或 API 金鑰的原生 Anthropic 整合，請參閱 [Anthropic 提供者](/zh-TW/providers/anthropic)。若要使用 OpenAI/Codex 訂閱，請參閱 [OpenAI 提供者](/zh-TW/providers/openai)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Anthropic 提供者" href="/zh-TW/providers/anthropic" icon="bolt">
    使用 Claude CLI 或 API 金鑰的原生 OpenClaw 整合。
  </Card>
  <Card title="OpenAI 提供者" href="/zh-TW/providers/openai" icon="robot">
    適用於 OpenAI/Codex 訂閱。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為概覽。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
