---
read_when:
    - 你想将 Fireworks 与 OpenClaw 搭配使用
    - 你需要 Fireworks API 密钥环境变量或默认模型 ID
    - 你正在调试 Fireworks 上 Kimi 关闭思考时的行为
summary: Fireworks 设置（认证 + 模型选择）
title: 烟花
x-i18n:
    generated_at: "2026-07-05T11:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容 API 暴露开放权重模型和路由模型。安装官方 Fireworks provider 插件，即可在运行时使用两个预编目的 Kimi 模型，以及任何 Fireworks 模型或路由器 ID。

| 属性            | 值                                                     |
| --------------- | ------------------------------------------------------ |
| 提供商 ID       | `fireworks`（别名：`fireworks-ai`）                    |
| 包              | `@openclaw/fireworks-provider`                         |
| 认证环境变量    | `FIREWORKS_API_KEY`                                    |
| 新手引导标志    | `--auth-choice fireworks-api-key`                      |
| 直接 CLI 标志   | `--fireworks-api-key <key>`                            |
| API             | OpenAI 兼容（`openai-completions`）                    |
| 基础 URL        | `https://api.fireworks.ai/inference/v1`                |
| 默认模型        | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 默认别名        | `Kimi K2.5 Turbo`                                      |

## 入门指南

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash 新手引导
openclaw onboard --auth-choice fireworks-api-key
```

```bash 直接标志
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash 仅环境变量
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    新手引导会把密钥存储到你的认证配置文件中的 `fireworks` 提供商下，并将 **Fire Pass** Kimi K2.5 Turbo 路由器设置为默认模型。

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    列表应包含 `Kimi K2.6` 和 `Kimi K2.5 Turbo (Fire Pass)`。如果 `FIREWORKS_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭证。

  </Step>
</Steps>

## 非交互式设置

对于脚本化或 CI 安装，请在命令行上传入所有内容：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                                               | 名称                        | 输入         | 上下文  | 最大输出   | 思考                 |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文本 + 图像  | 262,144 | 262,144    | 强制关闭             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文本 + 图像  | 256,000 | 256,000    | 强制关闭（默认）     |

<Note>
  OpenClaw 会将所有 Fireworks Kimi 模型固定为 `thinking: off`，因为 Fireworks 上的 Kimi 可能会把思维链泄漏到可见回复中，除非请求明确禁用思考。直接通过 [Moonshot](/zh-CN/providers/moonshot) 路由同一模型会保留 Kimi 推理输出。请参阅 [thinking modes](/zh-CN/tools/thinking)，了解如何在提供商之间切换。
</Note>

## 自定义 Fireworks 模型 ID

OpenClaw 在运行时接受任何 Fireworks 模型或路由器 ID。使用 Fireworks 显示的确切 ID，并为其添加 `fireworks/` 前缀。动态解析会克隆 Fire Pass 模板（文本 + 图像输入、OpenAI 兼容 API、默认成本为零），并在 ID 匹配 Kimi 模式时自动禁用思考。GLM 动态 ID 会被标记为仅文本，除非你配置带图像输入的自定义模型条目。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后面跟 Fireworks 平台中的确切 ID 或路由器路径。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构造 API 请求时会去掉 `fireworks/` 前缀，并将剩余路径作为 OpenAI 兼容的 `model` 字段发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks 提供 Kimi 时没有单独的推理通道，因此思维链可能会出现在可见的 `content` 流中。在每个 Fireworks Kimi 请求中，OpenClaw 都会发送 `thinking: { type: "disabled" }`，并从载荷中移除 `reasoning`、`reasoning_effort` 和 `reasoningEffort`（`extensions/fireworks/stream.ts`）。提供商策略（`extensions/fireworks/thinking-policy.ts`）只为 Kimi 模型 ID 声明 `off` 思考级别，因此手动 `/think` 切换和提供商策略表面会与运行时契约保持一致。

    若要端到端使用 Kimi 推理，请配置 [Moonshot provider](/zh-CN/providers/moonshot)，并通过它路由同一模型。

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），Fireworks 密钥必须对该进程可见，而不只是对你的交互式 shell 可见。

    <Warning>
      仅在交互式 shell 中导出的密钥无法帮助 launchd 或 systemd 守护进程，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置，使 Gateway 进程可以读取它。
    </Warning>

    OpenClaw 在加载配置时会加载 `~/.openclaw/.env`，因此存储在那里的密钥会在每个平台上到达托管的 Gateway 服务。轮换密钥后，请重启 Gateway 网关（或重新运行 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Thinking modes" href="/zh-CN/tools/thinking" icon="brain">
    `/think` 级别、提供商策略，以及路由具备推理能力的模型。
  </Card>
  <Card title="Moonshot" href="/zh-CN/providers/moonshot" icon="moon">
    通过 Moonshot 自己的 API 运行 Kimi，并获得原生思考输出。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排查和常见问题。
  </Card>
</CardGroup>
