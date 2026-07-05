---
read_when:
    - 你想将 Claude Max 订阅用于 OpenAI 兼容工具
    - 你想要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅的 Anthropic 访问与基于 API key 的 Anthropic 访问
summary: 社区代理，用于将 Claude 订阅凭证公开为 OpenAI 兼容端点
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-07-05T11:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一个社区 npm 包（不是 OpenClaw 插件），它会把 Claude Max/Pro 订阅暴露为 OpenAI 兼容的 API 端点，因此你可以把任何 OpenAI 兼容工具指向你的订阅，而不是使用 Anthropic API key。

<Warning>
仅表示技术兼容，并非官方认可的路径。Anthropic 过去曾阻止在 Claude Code 之外使用某些订阅；在依赖此方式前，请先确认 Anthropic 当前的计费规则。

Anthropic 的 Claude Code 文档将 `claude -p` 描述为 Agent SDK/程序化用法。截至 Anthropic 2026 年 6 月 15 日的支持更新，Claude Agent SDK、`claude -p` 和第三方应用用法都会消耗已登录订阅的用量限制（此前公布的独立 Agent SDK credit 方案已暂停）。请参阅 Anthropic 的 [Agent SDK 方案文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)、[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 方案文章，以及 [Anthropic 提供商](/zh-CN/providers/anthropic)，了解 OpenClaw 自身的 Claude CLI 计费说明。
</Warning>

## 为什么使用它

| 方式                      | 成本路径                                        | 最适合                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API key         | 通过 Claude Console 按 token 付费               | 生产应用、共享自动化、大用量 |
| Claude 订阅代理 | Claude Code / `claude -p` 方案和 credit 规则 | 使用兼容工具进行个人实验 |

此代理让 Claude Max 或 Pro 订阅可以配合 OpenAI 兼容工具使用。它不是无限量固定费率路径，它继承 Claude Code 的用量限制。对于生产用途，API key 仍然是更清晰的计费路径。

## 工作原理

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

代理会针对每个请求把 Claude Code CLI 作为子进程启动，将 OpenAI 格式的聊天请求转换为 CLI prompt，并以 OpenAI 格式流式传回（或返回）响应。

## 入门指南

<Steps>
  <Step title="安装代理">
    需要 Node.js 20+ 和已认证的 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="启动服务器">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="测试代理">
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
  <Step title="配置 OpenClaw">
    将 OpenClaw 指向该代理，作为自定义 OpenAI 兼容端点：

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
下面的 model id 是代理自身的目录，不是 OpenClaw 的 Anthropic 模型引用。每个 id 都映射到一个 Claude Code CLI 模型别名（`opus`、`sonnet`、`haiku`），因此只要 Anthropic 在 CLI 中更新该别名，底层模型就会随之变化。在依赖特定映射前，请检查代理当前的 README。
</Note>

| Model ID          | CLI 别名 | 当前映射 |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## 高级配置

<AccordionGroup>
  <Accordion title="代理式 OpenAI 兼容说明">
    这会使用 OpenClaw 的通用自定义 `/v1` OpenAI 兼容路由，与任何其他自托管 OpenAI 兼容后端使用相同路径：

    - 原生 OpenAI 专用请求整形不适用。
    - `/fast` 和 `service_tier` 仅适用于直连 `api.anthropic.com` 的流量；代理路由会保持 `service_tier` 不变（参见 [Anthropic 提供商快速模式](/zh-CN/providers/anthropic#advanced-configuration)）。
    - 没有 Responses `store`、prompt-cache 提示或 OpenAI reasoning 兼容 payload 整形。
    - OpenClaw 的 OpenAI/Codex 归因标头（`originator`、`version`、`User-Agent`）只会在原生 `api.openai.com` OAuth 流量中发送，不会发送到像此代理这样的自定义 `OPENAI_BASE_URL` 目标。

  </Accordion>

  <Accordion title="在 macOS 上通过 LaunchAgent 自动启动">
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

## 说明

- 继承 Claude Code 的 `claude -p` 计费、用量 credit 和速率限制行为。
- 仅绑定到 `127.0.0.1`；除 CLI 自身对 Anthropic 的调用外，不会向任何第三方服务器发送数据。
- 支持流式响应。
- 启动时不会检查认证失败，只有在聊天请求实际运行后才会暴露；如果 CLI 未认证，预期首次请求会失败，而不是服务器拒绝启动。

<Note>
如需使用 Claude CLI 或 API key 的原生 Anthropic 集成，请参阅 [Anthropic 提供商](/zh-CN/providers/anthropic)。对于 OpenAI/Codex 订阅，请参阅 [OpenAI provider](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic 提供商" href="/zh-CN/providers/anthropic" icon="bolt">
    使用 Claude CLI 或 API key 的 OpenClaw 原生集成。
  </Card>
  <Card title="OpenAI provider" href="/zh-CN/providers/openai" icon="robot">
    用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
