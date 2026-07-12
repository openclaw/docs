---
read_when:
    - 你想将 Fireworks 与 OpenClaw 搭配使用
    - 你需要 Fireworks API key 环境变量或默认模型 ID
    - 你正在调试 Fireworks 上 Kimi 关闭思考时的行为
summary: Fireworks 设置（身份验证 + 模型选择）
title: Fireworks
x-i18n:
    generated_at: "2026-07-11T20:52:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 通过与 OpenAI 兼容的 API 提供开放权重模型和路由模型。安装官方 Fireworks 提供商插件，即可在运行时使用两个预先编入目录的 Kimi 模型，以及任意 Fireworks 模型或路由器 ID。

| 属性          | 值                                                     |
| ------------- | ------------------------------------------------------ |
| 提供商 ID     | `fireworks`（别名：`fireworks-ai`）                    |
| 软件包        | `@openclaw/fireworks-provider`                         |
| 身份验证环境变量 | `FIREWORKS_API_KEY`                                 |
| 新手引导标志  | `--auth-choice fireworks-api-key`                      |
| 直接 CLI 标志 | `--fireworks-api-key <key>`                            |
| API           | 与 OpenAI 兼容（`openai-completions`）                 |
| 基础 URL      | `https://api.fireworks.ai/inference/v1`                |
| 默认模型      | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 默认别名      | `Kimi K2.5 Turbo`                                      |

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="设置 Fireworks API 密钥">
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

    新手引导会将密钥关联到身份验证配置文件中的 `fireworks` 提供商，并将 **Fire Pass** Kimi K2.5 Turbo 路由器设置为默认模型。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider fireworks
    ```

    列表中应包含 `Kimi K2.6` 和 `Kimi K2.5 Turbo (Fire Pass)`。如果无法解析 `FIREWORKS_API_KEY`，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

## 非交互式设置

对于脚本化安装或 CI 安装，请通过命令行传入所有参数：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                                               | 名称                        | 输入        | 上下文  | 最大输出 | 思考               |
| ------------------------------------------------------ | --------------------------- | ----------- | ------- | -------- | ------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文本 + 图像 | 262,144 | 262,144  | 强制关闭           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文本 + 图像 | 256,000 | 256,000  | 强制关闭（默认）   |

<Note>
  OpenClaw 将所有 Fireworks Kimi 模型固定为 `thinking: off`，因为除非请求明确禁用思考，否则 Fireworks 上的 Kimi 可能会将思维链泄露到可见回复中。通过 [Moonshot](/zh-CN/providers/moonshot) 直接路由同一模型，可以保留 Kimi 的推理输出。有关在提供商之间切换的信息，请参阅[思考模式](/zh-CN/tools/thinking)。
</Note>

## 自定义 Fireworks 模型 ID

OpenClaw 在运行时接受任意 Fireworks 模型或路由器 ID。请使用 Fireworks 显示的确切 ID，并为其添加 `fireworks/` 前缀。动态解析会复制 Fire Pass 模板（文本 + 图像输入、与 OpenAI 兼容的 API、默认成本为零）；当 ID 匹配 Kimi 模式时，还会自动禁用思考。除非你配置一个支持图像输入的自定义模型条目，否则动态 GLM ID 会被标记为仅支持文本。

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
  <Accordion title="模型 ID 前缀的工作原理">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后跟 Fireworks 平台中的确切 ID 或路由器路径。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构造 API 请求时会移除 `fireworks/` 前缀，并将剩余路径作为与 OpenAI 兼容的 `model` 字段发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="为什么强制关闭 Kimi 的思考">
    Fireworks 提供的 Kimi 没有独立的推理渠道，因此思维链可能会出现在可见的 `content` 流中。对于每个 Fireworks Kimi 请求，OpenClaw 都会发送 `thinking: { type: "disabled" }`，并从载荷中移除 `reasoning`、`reasoning_effort` 和 `reasoningEffort`（`extensions/fireworks/stream.ts`）。提供商策略（`extensions/fireworks/thinking-policy.ts`）仅为 Kimi 模型 ID 声明 `off` 思考级别，从而确保手动 `/think` 切换和提供商策略界面与运行时契约保持一致。

    若要端到端使用 Kimi 推理，请配置 [Moonshot 提供商](/zh-CN/providers/moonshot)，并通过它路由同一模型。

  </Accordion>

  <Accordion title="守护进程的环境可用性">
    如果 Gateway 网关作为托管服务运行（launchd、systemd、Docker），Fireworks 密钥必须对该进程可见，而不能只对交互式 shell 可见。

    <Warning>
      除非同时将环境导入 launchd 或 systemd，否则仅在交互式 shell 中导出的密钥无法供其守护进程使用。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置，使 Gateway 网关进程能够读取它。
    </Warning>

    OpenClaw 会在加载配置时加载 `~/.openclaw/.env`，因此存储在其中的密钥可在所有平台上传递给托管的 Gateway 网关服务。轮换密钥后，请重启 Gateway 网关（或重新运行 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    `/think` 级别、提供商策略，以及支持推理的模型路由。
  </Card>
  <Card title="Moonshot" href="/zh-CN/providers/moonshot" icon="moon">
    通过 Moonshot 自有 API 运行 Kimi，并获取原生思考输出。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
