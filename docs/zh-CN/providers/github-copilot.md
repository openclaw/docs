---
read_when:
    - 你想使用 GitHub Copilot 作为模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 你正在内置 Copilot 提供商、Copilot SDK harness 和 Copilot Proxy 之间进行选择
summary: 使用设备流程或非交互式令牌导入，从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-11T20:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 编程助手。它可让你访问 GitHub 账户和套餐所支持的 Copilot 模型。OpenClaw 能以三种不同方式将 Copilot 用作模型提供商或智能体运行时。

## 在 OpenClaw 中使用 Copilot 的三种方式

<Tabs>
  <Tab title="内置提供商（github-copilot）">
    使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为
    Copilot API 令牌。这是**默认**且最简单的方式，因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统会提示你访问一个 URL 并输入一次性代码。在流程完成之前，请保持
        终端处于打开状态。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或在配置中设置：

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
    如果你希望由 GitHub 的 Copilot CLI 和 SDK 管理所选
    `github-copilot/*` 模型的底层 Agent loop，请安装外部
    `@openclaw/copilot` 插件。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    然后为模型或提供商启用该运行时：

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

    如果你希望这些智能体轮次使用原生 Copilot CLI 会话、由 SDK 管理的线程状态，
    以及由 Copilot 管理的压缩，请选择此方式。如果没有显式启用
    `agentRuntime`，`github-copilot/*` 模型将继续使用内置提供商。完整的
    运行时契约请参阅 [Copilot SDK harness](/zh-CN/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会连接
    代理的 `/v1` 端点（默认为 `http://localhost:3000/v1`），并使用你配置的
    模型列表。

    `copilot-proxy` 插件随 OpenClaw 提供，且默认启用。使用以下命令配置基础
    URL 和模型 ID：

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    如果你已在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由，请选择
    此方式。VS Code 扩展必须持续运行。
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise（数据驻留）

如果你的组织使用支持数据驻留的 GitHub Enterprise 租户（例如
`your-org.ghe.com` 这样的 `*.ghe.com` 主机），Copilot 将位于租户本地端点，
而不是公共 `github.com`。OpenClaw 将此作为一等身份验证选项提供，因此你
无需手动编辑 URL。

<Steps>
  <Step title="选择 Enterprise 身份验证选项">
    在新手引导或 `openclaw models auth` 中，选择
    **GitHub Copilot（Enterprise / 数据驻留）**。系统会提示你输入
    Enterprise 域名（例如 `your-org.ghe.com`），然后针对该租户运行设备登录。

    仅输入租户根域名（`your-org.ghe.com`）。不接受
    `api.your-org.ghe.com` 或 `copilot-api.your-org.ghe.com` 等派生服务主机；
    OpenClaw 会根据租户根域名自动派生这些端点。

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="将域名持久化到配置">
    所选主机会存储在提供商参数中，以便后续令牌刷新和补全请求自动指向该租户：

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

设备流程、令牌交换和补全请求会分别解析到
`https://your-org.ghe.com/login/device/code`、
`https://api.your-org.ghe.com/copilot_internal/v2/token` 和
`https://copilot-api.your-org.ghe.com`。数据驻留令牌带有租户标记且不含代理
提示，因此补全服务的基础 URL 会回退到租户的 Copilot 主机，而不是公共端点。

<Note>
切换域名始终会重新运行设备登录。如果你已经存储了 Copilot 令牌并选择了不同的
域名（在公共 `github.com` 与 `*.ghe.com` 租户之间切换，或从一个租户切换到
另一个租户），OpenClaw 不会复用现有令牌，而是强制重新登录，以确保令牌的作用域
与即将写入配置的域名一致。为*同一*域名重新运行登录时，仍会询问是否复用当前令牌。
切换回公共 `github.com` 时，会清除持久化的 `githubDomain`，使配置恢复为默认值。
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 环境变量会覆盖所有解析 Copilot 域名的路径所得到的域名，
包括 Enterprise 设备登录（`--method device-enterprise`）、独立的
`openclaw models auth login-github-copilot` 快捷命令、令牌刷新、嵌入和补全。
对于完全无头或 CI 设置，请将其设为你的 `*.ghe.com` 主机。若要使用公共
`github.com`，请不要设置该变量，并确保配置参数不存在。登录流程会持久化用于签发
令牌的域名（针对公共 `github.com` 登录时则会清除该域名），因此即使之后取消设置
环境变量，路由仍会保持正确。
</Note>

## 可选标志

| 命令                                                                   | 标志            | 说明                                         |
| ---------------------------------------------------------------------- | --------------- | -------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 无需提示即可覆盖现有身份验证配置文件         |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 同时应用提供商推荐的默认模型                 |

```bash
# 跳过重新登录确认
openclaw models auth login-github-copilot --yes

# 一次完成登录并设置默认模型
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非交互式新手引导

设备登录流程需要交互式 TTY。对于无头设置，可使用
`openclaw onboard --non-interactive` 导入现有的 GitHub OAuth 访问令牌：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；传入 `--github-copilot-token` 会推断使用
GitHub Copilot 提供商的身份验证选项。如果省略该标志，新手引导将依次回退到
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 和 `GITHUB_TOKEN`。将
`COPILOT_GITHUB_TOKEN` 设置后使用 `--secret-input-mode ref`，可以存储由
环境变量支持的 `tokenRef`，而不是在 `auth-profiles.json` 中存储明文。

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。请直接在终端中运行，不要在非交互式脚本或
    CI 流水线中运行。
  </Accordion>

  <Accordion title="模型可用性取决于你的套餐">
    Copilot 模型的可用性取决于你的 GitHub 套餐。如果某个模型被拒绝，请尝试
    其他 ID（例如 `github-copilot/gpt-5.5`）。当前模型列表请参阅 GitHub 的
    [各 Copilot 套餐支持的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="从 Copilot API 实时刷新目录">
    设备登录（或环境变量）身份验证路径解析出 GitHub 令牌后，OpenClaw 会按需
    从 `${baseUrl}/models`（VS Code Copilot 使用的同一端点）刷新模型目录，
    使运行时无需频繁变更清单，即可跟踪每个账户的使用权限和准确的上下文窗口。
    新发布的 Copilot 模型无需升级 OpenClaw 即可显示，并且上下文窗口会反映
    各模型的实际限制（例如 gpt-5.x 系列为 400k，内部
    `claude-opus-*-1m` 变体为 1M）。

    当设备发现被禁用、用户没有 GitHub 身份验证配置文件、令牌交换失败或
    `/models` HTTPS 调用出错时，内置静态目录会继续作为可见的回退方案。
    若要选择退出并完全依赖静态清单目录（适用于离线或隔离网络场景）：

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
    Claude 模型 ID 会自动使用 Anthropic Messages 传输协议。Gemini 模型使用
    OpenAI Chat Completions 传输协议；GPT 和 o 系列模型继续使用
    OpenAI Responses 传输协议。OpenClaw 会根据模型引用选择正确的传输协议。
  </Accordion>

  <Accordion title="请求兼容性">
    OpenClaw 会在 Copilot 传输协议上发送 Copilot IDE 风格的请求标头
    （VS Code 编辑器/插件版本和 `vscode-chat` 集成 ID），将工具结果的后续
    轮次标记为由智能体发起，并在轮次包含图像输入时设置 Copilot 视觉标头。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 按以下优先级顺序从环境变量解析 Copilot 身份验证信息：

    | 优先级 | 变量                   | 备注                            |
    | ------ | ---------------------- | ------------------------------- |
    | 1      | `COPILOT_GITHUB_TOKEN` | 优先级最高，Copilot 专用        |
    | 2      | `GH_TOKEN`             | GitHub CLI 令牌（回退）         |
    | 3      | `GITHUB_TOKEN`         | 标准 GitHub 令牌（优先级最低）  |

    设置多个变量时，OpenClaw 会使用优先级最高的变量。设备登录流程
    （`openclaw models auth login-github-copilot`）会将令牌存储到身份验证
    配置文件存储区，并优先于所有环境变量。
  </Accordion>

  <Accordion title="令牌存储">
    登录流程会将 GitHub 令牌存储到身份验证配置文件存储区（配置文件 ID 为
    `github-copilot:github`），并在 OpenClaw 运行时将其交换为短期有效的
    Copilot API 令牌。你无需手动管理该令牌。
  </Accordion>
</AccordionGroup>

## 记忆搜索嵌入

GitHub Copilot 也可以作为[记忆搜索](/zh-CN/concepts/memory-search)的嵌入提供商。
如果你订阅了 Copilot 并已登录，OpenClaw 无需单独的 API 密钥即可将其用于嵌入。

### 配置

显式设置 `memorySearch.provider` 以使用 GitHub Copilot 嵌入。如果存在
GitHub 令牌，OpenClaw 会从 Copilot API 发现可用的嵌入模型，并自动选择最佳模型。

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

1. OpenClaw 解析你的 GitHub 令牌（来自环境变量或身份验证配置文件）。
2. 将其交换为短期有效的 Copilot API 令牌。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（偏好顺序：`text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. 将嵌入请求发送到 Copilot `/embeddings` 端点。

模型可用性取决于你的 GitHub 套餐。如果没有可用的嵌入模型，OpenClaw 会跳过
Copilot 并尝试下一个提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
</CardGroup>
