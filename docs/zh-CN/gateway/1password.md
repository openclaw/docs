---
read_when:
    - 你希望将 API key 从 openclaw.json 移出并存放在 1Password 中
    - 你以无头模式运行 Gateway 网关，并且需要用于 op 的服务账号身份验证
    - 你希望智能体使用 op CLI 读取或注入机密信息
summary: 使用 1Password CLI 解析 Gateway 网关密钥，并让智能体使用内置的 1password skill
title: 1Password
x-i18n:
    generated_at: "2026-07-14T13:37:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw 以两种相互独立的方式与 **1Password** 配合使用：

- **配置密钥：** `openclaw.json` 中的任何 [SecretRef](/zh-CN/gateway/secrets) 字段都可以在运行时通过 `op` CLI 解析，因此 API 密钥绝不会存放在配置文件中。
- **智能体工作流：**内置的 `1password` 技能会指导智能体使用 `op` 登录、读取密钥或注入密钥，以完成各自的任务。

## 要求

- Gateway 网关主机上已安装 [1Password CLI](https://developer.1password.com/docs/cli/get-started/)（`op`；在 macOS 上为 `brew install 1password-cli`）。
- 为 `op` 配置一种身份验证模式：
  - **服务账户**（建议用于无头 Gateway 网关）：在 Gateway 网关服务环境中导出 `OP_SERVICE_ACCOUNT_TOKEN`。不需要桌面应用，也不需要交互式登录。
  - **桌面应用集成**：1Password 应用与 Gateway 网关运行在同一台计算机上，并已启用 CLI 集成。首次调用可能会触发 Touch ID 或系统身份验证。
  - **独立登录**：`op signin` 会在每个会话中提示登录。智能体可以通过该技能使用这种方式，但它不适合在无头 Gateway 网关上解析配置密钥。

## 使用 op 解析配置密钥

声明一个运行 `op read` 并使用 `op://vault/item/field` 引用的 exec 密钥提供商，然后将任何支持 SecretRef 的字段指向它：

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件需要此项
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

各部分的协作方式如下：

- `command` 必须是绝对路径；`trustedDirs` 将其目录标记为受信任目录；由于 Homebrew 将 `op` 安装为符号链接，因此还需要 `allowSymlinkCommand`。
- `args` 会原样传递 `op://vault/item/field` 引用。OpenClaw 本身不会解析 `op://` 方案；它由 `op` 二进制文件解析。
- `passEnv` 会从 Gateway 网关环境中转发列出的变量。桌面应用集成需要 `HOME`；服务账户还要求 Gateway 网关服务环境中存在 `OP_SERVICE_ACCOUNT_TOKEN`（将其添加到 `passEnv`；仅当你接受令牌可从配置文件中读取时，才通过 `env` 设置）。
- 对于单值输出，请保留 `id: "value"`。使用 `jsonOnly: true` 和 JSON 载荷时，应改用 JSON 指针 ID 访问字段。
- 每个密钥使用一个提供商条目可确保引用便于审计；请根据使用方命名提供商（`onepassword_openai`、`onepassword_telegram`）。

有关解析顺序、缓存和失败语义，请参阅 [Gateway 网关密钥](/zh-CN/gateway/secrets)；有关所有接受 SecretRef 的字段，请参阅 [SecretRef 凭据范围](/zh-CN/reference/secretref-credential-surface)。

## 无头 Gateway 网关的服务账户设置

1. 在你的 1Password 账户中创建服务账户，并仅授予其对 Gateway 网关所需保险库项目的读取权限。
2. 向 Gateway 网关服务提供 `OP_SERVICE_ACCOUNT_TOKEN`（通过 launchd plist、systemd 单元或容器环境变量）。
3. 将 `"OP_SERVICE_ACCOUNT_TOKEN"` 添加到提供商的 `passEnv` 列表中。
4. 在 Gateway 网关主机环境中验证：`op whoami` 应直接输出服务账户，不应显示提示。

服务账户读取要求在 `op://` 引用中明确指定保险库名称。请严格限制账户权限范围；它是一项持有者凭据。

## 面向智能体的 1password 技能

OpenClaw 内置了 `1password` 技能，使智能体能够熟练操作 `op`：它会检测可用的身份验证模式（服务账户、桌面应用集成或独立登录），在读取任何内容前使用 `op whoami` 验证访问权限，并优先使用 `op run` / `op inject`，而不是将密钥值写入磁盘。该技能需要 `op` 二进制文件；如果缺失，则会提供 Homebrew 安装方式。

智能体会将其用于自身的工作流，例如在任务执行期间读取部署令牌，或向命令中注入环境变量。它与配置密钥解析相互独立；Gateway 网关无需任何技能参与即可解析 SecretRef。

## 安全说明

- 通过 exec 提供商解析的密钥值会保留在 Gateway 网关内存中；配置快照和 `config.get` 响应会遮盖 SecretRef 字段。
- 绝不要将密钥值放入 `openclaw.json`、日志或聊天中。配置中仅保留项目名称，值应存放在 1Password 中。
- 1Password 审计跟踪会显示服务账户的每次读取操作，使密钥轮换和事件审查切实可行。

## 故障排查

- `command not found` 或生成进程错误：使用 `op` 的绝对路径，并将其目录加入 `trustedDirs`。
- `op` 可以解析，但读取因符号链接错误而失败：对于 Homebrew 安装，请设置 `allowSymlinkCommand: true`。
- `account is not signed in`：对于服务账户，请确认 `OP_SERVICE_ACCOUNT_TOKEN` 已传入 Gateway 网关服务，并列在 `passEnv` 中；对于桌面集成，请确认应用正在运行且已解锁。
- 首次读取缓慢：提高提供商的 `timeoutMs`；在繁忙主机上，`op` 冷启动可能会超过严格的超时时间。
