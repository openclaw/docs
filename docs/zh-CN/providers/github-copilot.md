---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 使用设备流程从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T23:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot 是 GitHub 的 AI 编码助手。它为你的 GitHub 账户和套餐提供对 Copilot 模型的访问。OpenClaw 可以通过两种不同方式将 Copilot 用作模型提供商。

## 在 OpenClaw 中使用 Copilot 的两种方式

<Tabs>
  <Tab title="内置提供商（github-copilot）">
    使用原生设备登录流程获取 GitHub token，然后在 OpenClaw 运行时将其交换为 Copilot API token。这是**默认**且最简单的路径，因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统会提示你访问一个 URL 并输入一次性代码。在流程完成之前，请保持终端处于打开状态。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或者在配置中设置：

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

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会与该代理的 `/v1` 端点通信，并使用你在其中配置的模型列表。

    <Note>
    当你已经在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由时，请选择此方式。你必须启用该插件，并保持 VS Code 扩展持续运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| 标志 | 说明 |
| --------------- | --------------------------------------------------- |
| `--yes` | 跳过确认提示 |
| `--set-default` | 同时应用该提供商推荐的默认模型 |

```bash
# 跳过确认
openclaw models auth login-github-copilot --yes

# 登录并一步设置默认模型
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。请直接在终端中运行，不要在非交互式脚本或 CI 流水线中运行。
  </Accordion>

  <Accordion title="模型可用性取决于你的套餐">
    Copilot 模型的可用性取决于你的 GitHub 套餐。如果某个模型被拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="传输方式选择">
    Claude 模型 ID 会自动使用 Anthropic Messages 传输方式。GPT、o-series 和 Gemini 模型会继续使用 OpenAI Responses 传输方式。OpenClaw 会根据模型 ref 选择正确的传输方式。
  </Accordion>

  <Accordion title="请求兼容性">
    OpenClaw 会在 Copilot 传输中发送 Copilot IDE 风格的请求头，包括内置压缩、工具结果以及图片后续轮次。除非该行为已经过 Copilot API 验证，否则它不会为 Copilot 启用提供商级别的 Responses continuation。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 会按照以下优先级顺序，从环境变量中解析 Copilot 身份验证信息：

    | 优先级 | 变量 | 说明 |
    | -------- | --------------------- | -------------------------------- |
    | 1 | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用 |
    | 2 | `GH_TOKEN` | GitHub CLI token（回退） |
    | 3 | `GITHUB_TOKEN` | 标准 GitHub token（最低优先级） |

    当设置了多个变量时，OpenClaw 会使用优先级最高的那个。设备登录流程（`openclaw models auth login-github-copilot`）会将其 token 存储在 auth profile store 中，并优先于所有环境变量。

  </Accordion>

  <Accordion title="Token 存储">
    登录会将 GitHub token 存储在 auth profile store 中，并在 OpenClaw 运行时将其交换为 Copilot API token。你无需手动管理该 token。
  </Accordion>
</AccordionGroup>

<Warning>
需要交互式 TTY。请直接在终端中运行登录命令，不要在无头脚本或 CI 任务中运行。
</Warning>

## Memory search 嵌入

GitHub Copilot 还可以作为 [memory search](/zh-CN/concepts/memory-search) 的嵌入提供商。如果你订阅了 Copilot 并且已经登录，OpenClaw 可以在无需单独 API 密钥的情况下将其用于嵌入。

### 自动检测

当 `memorySearch.provider` 为 `"auto"`（默认值）时，GitHub Copilot 会以优先级 15 被尝试——位于本地嵌入之后，但在 OpenAI 和其他付费提供商之前。如果有可用的 GitHub token，OpenClaw 会从 Copilot API 发现可用的嵌入模型，并自动选择最佳模型。

### 显式配置

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 可选：覆盖自动发现的模型
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 工作原理

1. OpenClaw 解析你的 GitHub token（来自环境变量或 auth profile）。
2. 将其交换为短期有效的 Copilot API token。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（优先 `text-embedding-3-small`）。
5. 将嵌入请求发送到 Copilot `/embeddings` 端点。

模型可用性取决于你的 GitHub 套餐。如果没有可用的嵌入模型，OpenClaw 会跳过 Copilot 并尝试下一个提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障切换行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证细节和凭证复用规则。
  </Card>
</CardGroup>
