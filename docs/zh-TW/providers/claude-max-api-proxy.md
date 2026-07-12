---
read_when:
    - 你想要在相容 OpenAI 的工具中使用 Claude Max 訂閱方案
    - 你想要一個封裝 Claude Code 命令列介面的本機 API 伺服器
    - 你想評估訂閱制與基於 API 金鑰的 Anthropic 存取方式
summary: 社群代理服務，可將 Claude 訂閱憑證公開為與 OpenAI 相容的端點
title: Claude Max API 代理伺服器
x-i18n:
    generated_at: "2026-07-11T21:43:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一個社群 npm 套件（並非 OpenClaw 外掛），可將 Claude Max/Pro 訂閱公開為與 OpenAI 相容的 API 端點，讓你能將任何與 OpenAI 相容的工具指向你的訂閱，而不必使用 Anthropic API 金鑰。

<Warning>
這僅提供技術相容性，並非官方核准的使用方式。Anthropic 過去曾封鎖在 Claude Code 以外使用訂閱的某些方式；依賴此方案前，請先確認 Anthropic 目前的計費規則。

Anthropic 的 Claude Code 文件將 `claude -p` 描述為 Agent SDK／程式化用法。根據 Anthropic 於 2026 年 6 月 15 日發布的支援更新，Claude Agent SDK、`claude -p` 與第三方應用程式的用量，均會計入已登入訂閱的使用限制（先前宣布的獨立 Agent SDK 點數方案已暫停）。請參閱 Anthropic 的 [Agent SDK 方案文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)、[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 與 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 方案文章，以及 [Anthropic 提供者](/zh-TW/providers/anthropic)中 OpenClaw 自身的 Claude 命令列介面計費說明。
</Warning>

## 為何使用此方案

| 方式                      | 計費方式                                        | 最適合的情境                                 |
| ------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Anthropic API 金鑰        | 透過 Claude Console 按權杖計費                  | 正式環境應用程式、共用自動化、大量使用       |
| Claude 訂閱代理           | Claude Code／`claude -p` 方案與點數規則         | 搭配相容工具進行個人實驗                     |

此代理可讓 Claude Max 或 Pro 訂閱搭配與 OpenAI 相容的工具使用。這並非不限量的固定費率方案，而是沿用 Claude Code 的使用限制。對於正式環境用途，API 金鑰仍是計費方式更明確的選擇。

## 運作方式

```text
你的應用程式 -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     （OpenAI 格式）                   （轉換格式）                 （使用你的登入狀態）
```

代理會針對每個請求將 Claude Code 命令列介面啟動為子程序，把 OpenAI 格式的聊天請求轉換為命令列介面提示，並以 OpenAI 格式串流回傳（或直接回傳）回應。

## 開始使用

<Steps>
  <Step title="安裝代理">
    需要 Node.js 20+，並已完成 Claude Code 命令列介面的驗證。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

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

<Note>
下列模型 ID 屬於代理本身的目錄，並非 OpenClaw 的 Anthropic 模型參照。每個 ID 都會對應至 Claude Code 命令列介面的模型別名（`opus`、`sonnet`、`haiku`），因此每當 Anthropic 更新命令列介面中的別名時，底層模型也會隨之變更。依賴特定對應關係前，請先查看代理目前的 README。
</Note>

| 模型 ID            | 命令列介面別名 | 目前對應模型    |
| ------------------ | -------------- | --------------- |
| `claude-opus-4`    | `opus`         | Claude Opus 4.5 |
| `claude-sonnet-4`  | `sonnet`       | Claude Sonnet 4 |
| `claude-haiku-4`   | `haiku`        | Claude Haiku 4  |

## 進階設定

<AccordionGroup>
  <Accordion title="代理式 OpenAI 相容端點說明">
    此方案使用 OpenClaw 的通用自訂 `/v1` OpenAI 相容路由，與其他任何自行託管的 OpenAI 相容後端使用相同路徑：

    - 不會套用僅限原生 OpenAI 的請求格式調整。
    - `/fast` 與 `service_tier` 僅適用於直接傳送至 `api.anthropic.com` 的流量；代理路由不會修改 `service_tier`（請參閱 [Anthropic 提供者快速模式](/zh-TW/providers/anthropic#advanced-configuration)）。
    - 不會進行 Responses 的 `store`、提示快取提示或 OpenAI 推理相容性承載資料格式調整。
    - OpenClaw 的 OpenAI/Codex 歸屬標頭（`originator`、`version`、`User-Agent`）只會在原生 `api.openai.com` OAuth 流量中傳送，不會傳送至此代理這類自訂 `OPENAI_BASE_URL` 目標。

  </Accordion>

  <Accordion title="在 macOS 上使用 LaunchAgent 自動啟動">
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

- 沿用 Claude Code 的 `claude -p` 計費、使用點數與速率限制行為。
- 僅繫結至 `127.0.0.1`；除了命令列介面本身對 Anthropic 的呼叫外，不會將資料傳送至任何第三方伺服器。
- 支援串流回應。
- 啟動時不會檢查驗證失敗，只有在聊天請求實際執行後才會顯示；若命令列介面尚未通過驗證，第一次請求將會失敗，而伺服器不會拒絕啟動。

<Note>
若要透過 Claude 命令列介面或 API 金鑰使用原生 Anthropic 整合，請參閱 [Anthropic 提供者](/zh-TW/providers/anthropic)。若使用 OpenAI/Codex 訂閱，請參閱 [OpenAI 提供者](/zh-TW/providers/openai)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Anthropic 提供者" href="/zh-TW/providers/anthropic" icon="bolt">
    使用 Claude 命令列介面或 API 金鑰的原生 OpenClaw 整合。
  </Card>
  <Card title="OpenAI 提供者" href="/zh-TW/providers/openai" icon="robot">
    適用於 OpenAI/Codex 訂閱。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
