---
read_when:
    - 你想将 Claude Max 订阅与 OpenAI 兼容工具一起使用
    - 你需要一个包装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅与基于 API key 的 Anthropic 访问方式
summary: 社区代理，用于将 Claude 订阅凭证暴露为 OpenAI 兼容端点
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-06-27T03:02:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** 是一个社区工具，可将你的 Claude Max/Pro 订阅公开为 OpenAI 兼容 API 端点。这样你就可以在任何支持 OpenAI API 格式的工具中使用你的订阅。

<Warning>
此路径仅用于技术兼容。Anthropic 过去曾阻止在 Claude Code 之外使用某些订阅。
是否使用它需要你自行决定，并且在依赖它之前核实 Anthropic 当前的计费规则。

Anthropic 当前的支持文档称 `claude -p` 属于 Agent SDK/编程式使用。
自 2026 年 6 月 15 日起，订阅计划中的 `claude -p` 使用量会先消耗单独的
每月 Agent SDK 额度；如果启用了使用额度，之后会按标准 API 费率消耗使用额度。
</Warning>

## 为什么使用它？

| 方式                      | 成本路径                                        | 最适合                                   |
| ------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Anthropic API             | 通过 Claude Console 或云按 token 付费           | 生产应用、共享自动化、大用量             |
| Claude 订阅代理           | Claude Code / `claude -p` 计划和额度规则        | 使用兼容工具进行个人实验                 |

如果你有 Claude Max 或 Pro 订阅，并且想将其用于
OpenAI 兼容工具，这个代理可能适合某些个人工作流。它不是
无限量固定费率路径。对于生产用途，API key 仍然是更清晰的策略和计费路径。

## 工作原理

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

该代理：

1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式请求
2. 将它们转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 入门指南

<Steps>
  <Step title="安装代理">
    需要 Node.js 22+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
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

## 内置目录

| 模型 ID           | 映射到          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 高级配置

<AccordionGroup>
  <Accordion title="代理式 OpenAI 兼容说明">
    此路径使用与其他自定义 `/v1` 后端相同的代理式 OpenAI 兼容路由：

    - 原生 OpenAI 专用请求整形不适用
    - 没有 `service_tier`，没有 Responses `store`，没有 prompt-cache 提示，也没有
      OpenAI reasoning 兼容载荷整形
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
      不会注入到代理 URL 上

  </Accordion>

  <Accordion title="使用 LaunchAgent 在 macOS 上自动启动">
    创建一个 LaunchAgent 以自动运行该代理：

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
- 该代理在本地运行，不会向任何第三方服务器发送数据
- 完全支持流式响应

<Note>
如需通过 Claude CLI 或 API key 使用原生 Anthropic 集成，请参阅 [Anthropic 提供商](/zh-CN/providers/anthropic)。如需 OpenAI/Codex 订阅，请参阅 [OpenAI provider](/zh-CN/providers/openai)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Anthropic 提供商" href="/zh-CN/providers/anthropic" icon="bolt">
    通过 Claude CLI 或 API key 进行原生 OpenClaw 集成。
  </Card>
  <Card title="OpenAI provider" href="/zh-CN/providers/openai" icon="robot">
    用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
