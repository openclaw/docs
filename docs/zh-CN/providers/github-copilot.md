---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 在 OpenClaw 中使用设备流或非交互式令牌导入登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 编码助手。它为你的 GitHub 账户和套餐提供 Copilot
模型访问权限。OpenClaw 可以通过两种不同方式将 Copilot 用作模型
提供商。

## 在 OpenClaw 中使用 Copilot 的两种方式

<Tabs>
  <Tab title="内置提供商 (github-copilot)">
    使用原生设备登录流程获取 GitHub token，然后在 OpenClaw 运行时将其交换为
    Copilot API token。这是**默认**且最简单的路径，
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

        或在配置中：

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

  <Tab title="Copilot Proxy 插件 (copilot-proxy)">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会连接到
    该代理的 `/v1` 端点，并使用你在那里配置的模型列表。

    <Note>
    当你已经在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由时选择此项。
    你必须启用该插件，并保持 VS Code 扩展运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| 标志            | 描述                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 跳过确认提示                        |
| `--set-default` | 同时应用该提供商推荐的默认模型 |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非交互式新手引导

如果你已经有用于 Copilot 的 GitHub OAuth access token，可以在
headless 设置期间通过 `openclaw onboard --non-interactive` 导入它：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；传入 `--github-copilot-token` 会推断为
GitHub Copilot 提供商认证选择。如果省略该标志，新手引导会
回退到 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，然后是 `GITHUB_TOKEN`。在设置了
`COPILOT_GITHUB_TOKEN` 时使用 `--secret-input-mode ref`，可以存储由环境变量支持的
`tokenRef`，而不是在 `auth-profiles.json` 中存储明文。

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。请直接在
    终端中运行它，不要在非交互式脚本或 CI 流水线中运行。
  </Accordion>

  <Accordion title="模型可用性取决于你的套餐">
    Copilot 模型可用性取决于你的 GitHub 套餐。如果某个模型被
    拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="从 Copilot API 实时刷新目录">
    一旦设备登录（或环境变量）认证路径解析出 GitHub token，
    OpenClaw 会按需从 `${baseUrl}/models`
    （与 VS Code Copilot 使用的相同端点）刷新模型目录，因此运行时可以跟踪
    每个账户的权限和准确的上下文窗口，而无需改动清单。
    新发布的 Copilot 模型无需 OpenClaw
    升级即可显示，并且上下文窗口会反映真实的单模型限制
    （例如 gpt-5.x 系列为 400k，内部
    `claude-opus-*-1m` 变体为 1M）。

    当设备发现被禁用、用户没有 GitHub 认证配置文件、token 交换
    失败，或 `/models` HTTPS 调用出错时，内置静态目录会作为可见回退。
    如需选择退出并完全依赖静态清单目录（离线 / 隔离网络场景）：

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
    Claude 模型 ID 会自动使用 Anthropic Messages 传输协议。GPT、
    o-series 和 Gemini 模型保留 OpenAI Responses 传输协议。OpenClaw
    会根据模型引用选择正确的传输协议。
  </Accordion>

  <Accordion title="请求兼容性">
    OpenClaw 会在 Copilot 传输协议上发送 Copilot IDE 风格的请求头，
    包括内置压缩、工具结果和图像后续轮次。它
    不会为 Copilot 启用提供商级 Responses continuation，除非
    该行为已针对 Copilot 的 API 完成验证。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 会按以下优先级顺序从环境变量解析 Copilot 认证：

    | 优先级 | 变量              | 说明                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用 |
    | 2        | `GH_TOKEN`            | GitHub CLI token（回退）      |
    | 3        | `GITHUB_TOKEN`        | 标准 GitHub token（最低）   |

    当设置了多个变量时，OpenClaw 会使用优先级最高的那个。
    设备登录流程（`openclaw models auth login-github-copilot`）会将
    其 token 存储在认证配置文件存储中，并优先于所有环境
    变量。

  </Accordion>

  <Accordion title="Token 存储">
    登录会在认证配置文件存储中保存 GitHub token，并在
    OpenClaw 运行时将其交换为 Copilot API token。你无需手动管理
    token。
  </Accordion>
</AccordionGroup>

<Warning>
设备登录命令需要交互式 TTY。当你需要 headless 设置时，请使用非交互式
新手引导。
</Warning>

## 记忆搜索嵌入

GitHub Copilot 也可以作为
[记忆搜索](/zh-CN/concepts/memory-search)的嵌入提供商。如果你有 Copilot 订阅并且
已登录，OpenClaw 可以在无需单独 API key 的情况下将其用于嵌入。

### 自动检测

当 `memorySearch.provider` 为 `"auto"`（默认值）时，GitHub Copilot 会以
优先级 15 被尝试 -- 在本地嵌入之后，但在 OpenAI 和其他付费
提供商之前。如果 GitHub token 可用，OpenClaw 会从 Copilot API 发现可用的
嵌入模型，并自动选择最佳模型。

### 显式配置

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

1. OpenClaw 解析你的 GitHub token（来自环境变量或认证配置文件）。
2. 将其交换为短期有效的 Copilot API token。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（优先选择 `text-embedding-3-small`）。
5. 将嵌入请求发送到 Copilot `/embeddings` 端点。

模型可用性取决于你的 GitHub 套餐。如果没有可用的嵌入模型，
OpenClaw 会跳过 Copilot 并尝试下一个提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证详情和凭据复用规则。
  </Card>
</CardGroup>
