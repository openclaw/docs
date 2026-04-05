---
read_when:
    - 你想将 Claude Max 订阅与兼容 OpenAI 的工具一起使用
    - 你想要一个封装 Claude Code CLI 的本地 API 服务器
    - 你想评估基于订阅和基于 API 密钥的 Anthropic 访问方式
summary: 将 Claude 订阅凭证暴露为与 OpenAI 兼容端点的社区代理
title: Claude Max API 代理
x-i18n:
    generated_at: "2026-04-05T08:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API 代理

**claude-max-api-proxy** 是一个社区工具，可将你的 Claude Max/Pro 订阅暴露为与 OpenAI 兼容的 API 端点。这样你就可以在任何支持 OpenAI API 格式的工具中使用你的订阅。

<Warning>
这条路径仅用于技术兼容性。Anthropic 过去曾阻止过一些在 Claude Code 之外的订阅
用法。你必须自行决定是否使用它，并在依赖它之前核实 Anthropic 当前的条款。
</Warning>

## 为什么使用这个？

| 方式                    | 成本                                                | 最适合                                  |
| ----------------------- | --------------------------------------------------- | --------------------------------------- |
| Anthropic API           | 按 token 付费（Opus 约为输入 $15/M，输出 $75/M）    | 生产应用、高调用量                      |
| Claude Max 订阅         | 每月固定 $200                                       | 个人使用、开发、无限使用量              |

如果你有 Claude Max 订阅，并希望将其与兼容 OpenAI 的工具一起使用，那么这个代理可能会降低某些工作流的成本。对于生产用途，API 密钥仍然是更明确的策略路径。

## 工作原理

```
你的应用 → claude-max-api-proxy → Claude Code CLI → Anthropic（通过订阅）
   （OpenAI 格式）               （转换格式）          （使用你的登录）
```

该代理会：

1. 在 `http://localhost:3456/v1/chat/completions` 接收 OpenAI 格式请求
2. 将它们转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 安装

```bash
# 需要 Node.js 20+ 和 Claude Code CLI
npm install -g claude-max-api-proxy

# 验证 Claude CLI 已认证
claude --version
```

## 用法

### 启动服务器

```bash
claude-max-api
# 服务器运行在 http://localhost:3456
```

### 测试

```bash
# 健康检查
curl http://localhost:3456/health

# 列出模型
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 配合 OpenClaw 使用

你可以将 OpenClaw 指向该代理，把它当作自定义的 OpenAI 兼容端点：

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

这条路径使用与其他自定义
`/v1` 后端相同的代理式 OpenAI 兼容路由：

- 不适用原生 OpenAI 专属请求塑形
- 没有 `service_tier`、没有 Responses `store`、没有 prompt-cache 提示，也没有
  OpenAI reasoning-compat 载荷塑形
- 不会在代理 URL 上注入隐藏的 OpenClaw 归因头（`originator`、`version`、`User-Agent`）

## 可用模型

| 模型 ID            | 映射到           |
| ------------------ | ---------------- |
| `claude-opus-4`    | Claude Opus 4    |
| `claude-sonnet-4`  | Claude Sonnet 4  |
| `claude-haiku-4`   | Claude Haiku 4   |

## 在 macOS 上自动启动

创建一个 LaunchAgent，以自动运行该代理：

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

## 链接

- **npm：** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub：** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues：** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 说明

- 这是一个**社区工具**，并非 Anthropic 或 OpenClaw 官方支持
- 需要有效的 Claude Max/Pro 订阅，并且 Claude Code CLI 已完成认证
- 该代理在本地运行，不会将数据发送到任何第三方服务器
- 完全支持流式响应

## 另请参见

- [Anthropic 提供商](/providers/anthropic) - 使用 Claude CLI 或 API 密钥的原生 OpenClaw 集成
- [OpenAI 提供商](/providers/openai) - 适用于 OpenAI/Codex 订阅
