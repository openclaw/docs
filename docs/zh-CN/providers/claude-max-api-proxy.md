---
read_when:
    - 你想将 Claude Max 订阅与 OpenAI 兼容工具一起使用
    - 你需要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅和基于 API 密钥的 Anthropic 访问方式
summary: 社区代理，用于将 Claude 订阅凭证暴露为 OpenAI 兼容端点
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-06-28T20:44:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一个社区工具，可将你的 Claude Max/Pro 订阅暴露为 OpenAI 兼容的 API 端点。这使你可以在任何支持 OpenAI API 格式的工具中使用你的订阅。

<Warning>
此路径仅用于技术兼容。Anthropic 过去曾阻止部分在 Claude Code 之外的订阅
使用。你必须自行决定是否使用它，并在依赖它之前核实 Anthropic 当前的计费规则。

Anthropic 当前的支持文档表示，`claude -p` 属于 Agent SDK/程序化使用。
Anthropic 于 2026 年 6 月 15 日发布的支持更新暂停了此前宣布的单独 Agent SDK
额度计划。目前，Claude Agent SDK、`claude -p` 和第三方应用使用
仍会消耗已登录订阅的使用额度限制。

在依赖此路径之前，请查看 Anthropic 的 [Agent SDK 计划
文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)，
以及适用于
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
或
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
账户的 Claude Code 支持文章。
</Warning>

## 为什么使用这个？

| 方式                      | 成本路径                                        | 最适合                                   |
| ------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Anthropic API             | 通过 Claude Console 或云按 token 付费           | 生产应用、共享自动化、大批量使用        |
| Claude 订阅代理           | Claude Code / `claude -p` 计划和额度规则        | 使用兼容工具进行个人实验                |

如果你有 Claude Max 或 Pro 订阅，并希望将其用于
OpenAI 兼容工具，此代理可能适合某些个人工作流。它不是
无限量的包月路径。对于生产使用，API 密钥仍是更清晰的政策和计费路径。

## 工作原理

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

该代理：

1. 在 `http://localhost:3456/v1/chat/completions` 接收 OpenAI 格式的请求
2. 将其转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 入门指南

<Steps>
  <Step title="Install the proxy">
    需要 Node.js 22+ 和 Claude Code CLI。

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

## 内置目录

| 模型 ID           | 映射到          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 高级配置

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    此路径使用与其他自定义 `/v1` 后端相同的代理式 OpenAI 兼容路由：

    - 不适用原生 OpenAI 专用请求整形
    - 没有 `service_tier`，没有 Responses `store`，没有提示词缓存提示，也没有
      OpenAI 推理兼容载荷整形
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
      不会注入到代理 URL 上

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    创建 LaunchAgent 以自动运行该代理：

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

- 这是一个**社区工具**，并非由 Anthropic 或 OpenClaw 官方支持
- 需要有效的 Claude Max/Pro 订阅，并且 Claude Code CLI 已完成身份验证
- 继承 Claude Code `claude -p` 的计费、使用额度和速率限制行为
- 该代理在本地运行，不会将数据发送到任何第三方服务器
- 完全支持流式响应

<Note>
如需使用 Claude CLI 或 API 密钥的原生 Anthropic 集成，请参见 [Anthropic 提供商](/zh-CN/providers/anthropic)。如需 OpenAI/Codex 订阅，请参见 [OpenAI provider](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/zh-CN/providers/anthropic" icon="bolt">
    使用 Claude CLI 或 API 密钥的 OpenClaw 原生集成。
  </Card>
  <Card title="OpenAI provider" href="/zh-CN/providers/openai" icon="robot">
    用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
