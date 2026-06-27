---
read_when:
    - 你想将 Fireworks 与 OpenClaw 一起使用
    - 你需要 Fireworks API key 环境变量或默认模型 ID
    - 你正在调试 Fireworks 上的 Kimi thinking-off 行为
summary: Fireworks 设置（认证 + 模型选择）
title: Fireworks
x-i18n:
    generated_at: "2026-06-27T03:03:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容 API 暴露开放权重模型和路由模型。安装官方 Fireworks 提供商插件，即可在运行时使用两个预置目录的 Kimi 模型，以及任意 Fireworks 模型或路由器 id。

| 属性            | 值                                                     |
| --------------- | ------------------------------------------------------ |
| 提供商 id       | `fireworks`（别名：`fireworks-ai`）                    |
| 包              | `@openclaw/fireworks-provider`                         |
| 凭证环境变量    | `FIREWORKS_API_KEY`                                    |
| 新手引导标志    | `--auth-choice fireworks-api-key`                      |
| 直接 CLI 标志   | `--fireworks-api-key <key>`                            |
| API             | OpenAI 兼容（`openai-completions`）                    |
| 基础 URL        | `https://api.fireworks.ai/inference/v1`                |
| 默认模型        | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 默认别名        | `Kimi K2.5 Turbo`                                      |

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="设置 Fireworks API key">
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

    新手引导会把密钥按 `fireworks` 提供商存入你的凭证配置，并将 **Fire Pass** Kimi K2.5 Turbo 路由器设为默认模型。

  </Step>
  <Step title="验证模型可用">
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
  OpenClaw 将所有 Fireworks Kimi 模型固定为 `thinking: off`，因为 Fireworks 在生产环境中会拒绝 Kimi 思考参数。直接通过 [Moonshot](/zh-CN/providers/moonshot) 路由同一模型可保留 Kimi 推理输出。请参阅[思考模式](/zh-CN/tools/thinking)，了解如何在提供商之间切换。
</Note>

## 自定义 Fireworks 模型 id

OpenClaw 在运行时接受任意 Fireworks 模型或路由器 id。使用 Fireworks 显示的准确 id，并为其添加 `fireworks/` 前缀。动态解析会克隆 Fire Pass 模板（文本 + 图像输入、OpenAI 兼容 API、默认成本为零），并在 id 匹配 Kimi 模式时自动禁用思考。除非你配置带图像输入的自定义模型条目，否则 GLM 动态 id 会被标记为仅文本。

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
  <Accordion title="模型 id 前缀的工作方式">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后面跟着 Fireworks 平台中的准确 id 或路由器路径。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构造 API 请求时会剥离 `fireworks/` 前缀，并将剩余路径作为 OpenAI 兼容的 `model` 字段发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="为什么 Kimi 会被强制关闭思考">
    如果请求携带 `reasoning_*` 参数，Fireworks K2.6 会返回 400，即使 Kimi 通过 Moonshot 自有 API 支持思考也是如此。提供商策略（`extensions/fireworks/thinking-policy.ts`）只为 Kimi 模型 id 公布 `off` 思考级别，因此手动 `/think` 切换和提供商策略表面会与运行时契约保持一致。

    若要端到端使用 Kimi 推理，请配置 [Moonshot 提供商](/zh-CN/providers/moonshot)，并通过它路由同一模型。

  </Accordion>

  <Accordion title="守护进程的环境可用性">
    如果 Gateway 网关 作为托管服务运行（launchd、systemd、Docker），Fireworks 密钥必须对该进程可见，而不仅仅是对你的交互式 shell 可见。

    <Warning>
      仅在交互式 shell 中导出的密钥无法帮助 launchd 或 systemd 守护进程，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置，使 Gateway 网关 进程能够读取它。
    </Warning>

    在 macOS 上，`openclaw gateway install` 已经会将 `~/.openclaw/.env` 接入 LaunchAgent 环境文件。轮换密钥后，请重新运行 install（或 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    `/think` 级别、提供商策略，以及路由具备推理能力的模型。
  </Card>
  <Card title="Moonshot" href="/zh-CN/providers/moonshot" icon="moon">
    通过 Moonshot 自有 API 运行带原生思考输出的 Kimi。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
