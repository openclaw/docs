---
read_when:
    - 你希望在兼容 OpenAI 的工具中使用 Claude Max 订阅
    - 你需要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅和基于 API key 的 Anthropic 访问方式
summary: 将 Claude 订阅凭据公开为 OpenAI 兼容端点的社区代理
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-07-11T20:51:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一个社区 npm 软件包（不是 OpenClaw 插件），它将 Claude Max/Pro 订阅公开为与 OpenAI 兼容的 API 端点，因此你可以让任何与 OpenAI 兼容的工具使用你的订阅，而不必使用 Anthropic API key。

<Warning>
这仅表示技术上兼容，并非官方认可的使用路径。Anthropic 过去曾阻止在 Claude Code 之外使用某些订阅；在依赖此方案之前，请核实 Anthropic 当前的计费规则。

Anthropic 的 Claude Code 文档将 `claude -p` 描述为 Agent SDK/程序化用法。根据 Anthropic 于 2026 年 6 月 15 日发布的支持更新，Claude Agent SDK、`claude -p` 和第三方应用的使用量均计入已登录订阅的使用限额（此前公布的独立 Agent SDK 点数方案已暂停）。请参阅 Anthropic 的 [Agent SDK 套餐文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)、[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 套餐文章，以及 [Anthropic 提供商](/zh-CN/providers/anthropic)，了解 OpenClaw 自身关于 Claude CLI 计费的说明。
</Warning>

## 为什么使用此方案

| 方式                      | 计费路径                                        | 最适合                                     |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API key         | 通过 Claude Console 按 token 付费               | 生产应用、共享自动化和大规模用量           |
| Claude 订阅代理           | Claude Code / `claude -p` 套餐和点数规则        | 使用兼容工具进行个人实验                   |

此代理让 Claude Max 或 Pro 订阅可与 OpenAI 兼容工具配合使用。它并不是不限量的固定费率方案，而是沿用 Claude Code 的使用限额。对于生产用途，API key 仍是计费方式更清晰的路径。

## 工作原理

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

代理会针对每个请求将 Claude Code CLI 作为子进程启动，把 OpenAI 格式的聊天请求转换为 CLI 提示词，并以 OpenAI 格式流式传回（或直接返回）响应。

## 入门指南

<Steps>
  <Step title="Install the proxy">
    需要 Node.js 20+ 以及已完成身份验证的 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
  <Step title="Configure OpenClaw">
    将 OpenClaw 指向该代理，把它作为自定义的 OpenAI 兼容端点：

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
下方的模型 ID 属于代理自身的目录，并非 OpenClaw 的 Anthropic 模型引用。每个 ID 都映射到一个 Claude Code CLI 模型别名（`opus`、`sonnet`、`haiku`），因此每当 Anthropic 在 CLI 中更新该别名时，底层模型也会随之变化。在依赖特定映射之前，请查看代理当前的 README。
</Note>

| 模型 ID             | CLI 别名  | 当前映射        |
| ------------------- | --------- | --------------- |
| `claude-opus-4`     | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4`   | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`    | `haiku`   | Claude Haiku 4  |

## 高级配置

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    此方案使用 OpenClaw 通用的自定义 `/v1` OpenAI 兼容路由，与其他任何自托管 OpenAI 兼容后端使用相同路径：

    - 不会应用仅限原生 OpenAI 的请求结构调整。
    - `/fast` 和 `service_tier` 仅适用于直接发送到 `api.anthropic.com` 的流量；代理路由不会修改 `service_tier`（请参阅 [Anthropic 提供商快速模式](/zh-CN/providers/anthropic#advanced-configuration)）。
    - 不会进行 Responses `store`、提示词缓存提示或 OpenAI 推理兼容载荷的结构调整。
    - OpenClaw 的 OpenAI/Codex 归属标头（`originator`、`version`、`User-Agent`）仅随原生 `api.openai.com` OAuth 流量发送，不会发送到此代理这类自定义 `OPENAI_BASE_URL` 目标。

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
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

## 注意事项

- 沿用 Claude Code 的 `claude -p` 计费、使用点数和速率限制行为。
- 仅绑定到 `127.0.0.1`；除了 CLI 自身向 Anthropic 发出的调用之外，不会将数据发送到任何第三方服务器。
- 支持流式响应。
- 启动时不会检查身份验证失败，只有在实际运行聊天请求后才会暴露此问题；如果 CLI 尚未完成身份验证，预期首次请求会失败，而不是服务器拒绝启动。

<Note>
有关通过 Claude CLI 或 API key 进行原生 Anthropic 集成的信息，请参阅 [Anthropic 提供商](/zh-CN/providers/anthropic)。有关 OpenAI/Codex 订阅的信息，请参阅 [OpenAI provider](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/zh-CN/providers/anthropic" icon="bolt">
    通过 Claude CLI 或 API key 与 OpenClaw 进行原生集成。
  </Card>
  <Card title="OpenAI provider" href="/zh-CN/providers/openai" icon="robot">
    适用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考。
  </Card>
</CardGroup>
