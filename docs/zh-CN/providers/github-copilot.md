---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 你正在内置 Copilot 提供商、Copilot SDK harness 和 Copilot Proxy 之间进行选择
summary: 使用设备流程或非交互式令牌导入，从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-05T11:37:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8af0ed48af8586da0e2bd922e3a674b73c57fdaf25ae5a3a7988e38a467cab7f
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 编码助手。它会为你的 GitHub 账号和计划提供 Copilot
模型访问权限。OpenClaw 可以通过三种不同方式将 Copilot 用作模型
提供商或智能体运行时。

## 在 OpenClaw 中使用 Copilot 的三种方式

<Tabs>
  <Tab title="内置提供商（github-copilot）">
    使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为
    Copilot API 令牌。这是**默认**且最简单的路径，
    因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统会提示你访问一个 URL 并输入一次性代码。保持
        终端打开，直到流程完成。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或者在配置中：

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK harness 插件（copilot）">
    如果你希望 GitHub 的 Copilot CLI 和 SDK 为选定的
    `github-copilot/*` 模型托管底层 Agent loop，请安装外部
    `@openclaw/copilot` 插件。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    然后让某个模型或提供商选择使用该运行时：

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    当你希望这些智能体轮次使用原生 Copilot CLI 会话、由 SDK 管理的线程
    状态，以及由 Copilot 托管的压缩时，请选择此方式。如果没有
    显式的 `agentRuntime` 选择加入，`github-copilot/*` 模型会继续使用
    内置提供商。完整的运行时契约见 [Copilot SDK harness](/zh-CN/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会连接到
    该代理的 `/v1` 端点（默认 `http://localhost:3000/v1`），并使用你配置的
    模型列表。

    `copilot-proxy` 插件随 OpenClaw 一起提供，并默认启用。
    使用以下命令配置基础 URL 和模型 ID：

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    当你已经在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由时，请选择此方式。
    VS Code 扩展必须保持运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| 命令                                                                   | 标志            | 描述                                                 |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 不提示，覆盖现有凭证配置                            |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 同时应用该提供商推荐的默认模型                      |

```bash
# Skip the re-login confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非交互式新手引导

设备登录流程需要交互式 TTY。对于无头设置，请使用
`openclaw onboard --non-interactive` 导入现有的 GitHub OAuth 访问令牌：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；传入 `--github-copilot-token` 会推断
GitHub Copilot 提供商凭证选项。如果省略该标志，新手引导会依次回退到
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，然后是 `GITHUB_TOKEN`。使用
`--secret-input-mode ref` 并设置 `COPILOT_GITHUB_TOKEN`，可以存储由环境变量支持的
`tokenRef`，而不是在 `auth-profiles.json` 中存储明文。

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。请直接在
    终端中运行它，不要在非交互式脚本或 CI 流水线中运行。
  </Accordion>

  <Accordion title="模型可用性取决于你的计划">
    Copilot 模型可用性取决于你的 GitHub 计划。如果某个模型被
    拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-5.5`）。当前模型列表见
    GitHub 的 [每个 Copilot 计划支持的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="从 Copilot API 实时刷新目录">
    一旦设备登录（或环境变量）凭证路径解析出 GitHub 令牌，
    OpenClaw 会按需从 `${baseUrl}/models`
    （VS Code Copilot 使用的同一端点）刷新模型目录，因此运行时可以跟踪
    每个账号的权益和准确的上下文窗口，而无需清单
    变更。新发布的 Copilot 模型无需 OpenClaw
    升级即可可见，并且上下文窗口会反映真实的逐模型限制
    （例如 gpt-5.x 系列为 400k，内部
    `claude-opus-*-1m` 变体为 1M）。

    当设备发现被禁用、用户没有 GitHub 凭证配置、令牌交换
    失败，或 `/models` HTTPS 调用出错时，内置静态目录会保留为可见回退。
    若要选择退出并完全依赖静态清单目录
    （离线 / 隔离网络场景）：

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="传输协议选择">
    Claude 模型 ID 会自动使用 Anthropic Messages 传输协议。
    Gemini 模型使用 OpenAI Chat Completions 传输协议；GPT 和 o-series
    模型保留 OpenAI Responses 传输协议。OpenClaw 会根据模型引用选择正确的
    传输协议。
  </Accordion>

  <Accordion title="请求兼容性">
    OpenClaw 会在 Copilot 传输协议上发送 Copilot IDE 风格的请求标头
    （VS Code 编辑器/插件版本和 `vscode-chat` 集成 ID），
    将工具结果的后续轮次标记为由智能体发起，并在轮次携带图像输入时设置 Copilot
    视觉标头。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 会按以下优先级顺序从环境变量解析 Copilot 凭证：

    | 优先级 | 变量                  | 说明                             |
    | ------ | --------------------- | -------------------------------- |
    | 1      | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用         |
    | 2      | `GH_TOKEN`            | GitHub CLI 令牌（回退）          |
    | 3      | `GITHUB_TOKEN`        | 标准 GitHub 令牌（最低）         |

    当设置了多个变量时，OpenClaw 会使用优先级最高的一个。
    设备登录流程（`openclaw models auth login-github-copilot`）会将
    其令牌存储在凭证配置存储中，并优先于所有环境
    变量。

  </Accordion>

  <Accordion title="令牌存储">
    登录会在凭证配置存储中存储一个 GitHub 令牌（配置 ID
    `github-copilot:github`），并在 OpenClaw 运行时将其交换为短期 Copilot API
    令牌。你不需要手动管理该令牌。
  </Accordion>
</AccordionGroup>

## 记忆搜索嵌入

GitHub Copilot 也可以作为
[记忆搜索](/zh-CN/concepts/memory-search)的嵌入提供商。如果你有 Copilot 订阅并且
已经登录，OpenClaw 可以使用它生成嵌入，而无需单独的 API key。

### 配置

将 `memorySearch.provider` 显式设置为使用 GitHub Copilot 嵌入。如果
GitHub 令牌可用，OpenClaw 会从
Copilot API 发现可用的嵌入模型，并自动选择最佳模型。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 工作原理

1. OpenClaw 解析你的 GitHub 令牌（来自环境变量或凭证配置）。
2. 将其交换为短期 Copilot API 令牌。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（偏好顺序：`text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. 将嵌入请求发送到 Copilot `/embeddings` 端点。

模型可用性取决于你的 GitHub 计划。如果没有可用的嵌入模型，
OpenClaw 会跳过 Copilot 并尝试下一个提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和凭证" href="/zh-CN/gateway/authentication" icon="key">
    凭证详情和凭据复用规则。
  </Card>
</CardGroup>
