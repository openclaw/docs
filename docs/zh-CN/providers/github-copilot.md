---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 使用设备流程从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T11:08:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot 是 GitHub 的 AI 编码助手。它会为你的 GitHub 账号和订阅计划提供对 Copilot 模型的访问权限。OpenClaw 可以通过两种不同方式将 Copilot 用作模型提供商。

## 在 OpenClaw 中使用 Copilot 的两种方式

<Tabs>
  <Tab title="内置提供商（github-copilot）">
    使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为 Copilot API 令牌。这是**默认**且最简单的方式，因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统会提示你访问一个 URL 并输入一次性代码。在流程完成前，请保持终端处于打开状态。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        或者在配置中：

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会与代理的 `/v1` 端点通信，并使用你在其中配置的模型列表。

    <Note>
    如果你已经在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由，请选择此方式。你必须启用该插件，并保持 VS Code 扩展持续运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| Flag            | 描述 |
| --------------- | --------------------------------------------------- |
| `--yes`         | 跳过确认提示 |
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

  <Accordion title="模型可用性取决于你的订阅计划">
    Copilot 模型的可用性取决于你的 GitHub 订阅计划。如果某个模型被拒绝，请尝试其他 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="传输方式选择">
    Claude 模型 ID 会自动使用 Anthropic Messages 传输方式。GPT、o-series 和 Gemini 模型会继续使用 OpenAI Responses 传输方式。OpenClaw 会根据模型 ref 选择正确的传输方式。
  </Accordion>

  <Accordion title="环境变量 解析顺序">
    OpenClaw 会按以下优先级顺序从环境变量中解析 Copilot 身份验证信息：

    | Priority | Variable              | 说明 |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用 |
    | 2        | `GH_TOKEN`            | GitHub CLI 令牌（回退） |
    | 3        | `GITHUB_TOKEN`        | 标准 GitHub 令牌（最低优先级） |

    当设置了多个环境变量时，OpenClaw 会使用优先级最高的那个。设备登录流程（`openclaw models auth login-github-copilot`）会将其令牌存储到身份验证配置文件存储中，并且优先于所有环境变量。

  </Accordion>

  <Accordion title="令牌存储">
    登录流程会将 GitHub 令牌存储到身份验证配置文件存储中，并在 OpenClaw 运行时将其交换为 Copilot API 令牌。你无需手动管理该令牌。
  </Accordion>
</AccordionGroup>

<Warning>
需要交互式 TTY。请直接在终端中运行登录命令，不要在无头脚本或 CI 任务中运行。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证细节和凭证复用规则。
  </Card>
</CardGroup>
