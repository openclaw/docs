---
read_when:
    - 你希望智能体请求经过筛选的 1Password 密钥
    - 你需要按密钥设置审批策略并保留审计历史
    - 你正在为 OpenClaw 配置 1Password 服务账户
summary: 使用可选的 1Password 插件作为经审计的智能体机密信息代理服务
title: 1Password 密钥代理器
x-i18n:
    generated_at: "2026-07-14T13:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0b199fcb582739dff5d0f7583482ced8e30dfc7e20b62b984391ad7bb92f67e1
    source_path: plugins/onepassword.md
    workflow: 16
---

# 1Password 机密代理

内置的 `onepassword` 插件为智能体提供一个受策略控制的工具，用于
读取一组精选的 1Password 字段。该插件默认禁用，在
`plugins.entries.onepassword.config` 存在之前不会执行任何操作。

这是一个智能体工具，而不是 SecretRef 提供商。它不会注入环境变量，
也不会解析 OpenClaw 配置中的机密。

## 安全模型

- 仅支持服务账户身份验证。令牌保存在本地凭据文件中，
  绝不会在 `openclaw.json` 中接受。
- 仅限精选注册表。智能体可以列出已配置的 slug，但该插件绝不会
  枚举 1Password 保管库。
- 每个 slug 均采用 `auto`、`approve` 或 `deny` 策略。
- 批准授权会过期。缓存值绝不会绕过当前策略。
- 每次访问尝试都会记录在 OpenClaw 的共享 SQLite 状态中。审计
  行包含所提供的原因；请确保原因不含敏感信息。代理绝不会
  将获取到的值或服务令牌复制到审计行中。
- 当前工具执行结束后，OpenClaw 所有的对话记录持久化机制
  会将成功的 `get` 值替换为已脱敏的元数据。
- 在该次执行中，此值对模型可见。如果模型将其复制到
  后续工具调用或回复中，该单独记录不在此插件的
  持久化钩子范围内。请保持策略范围严格，不要要求模型复述
  该值。
- 每次缓存未命中时，插件会调用一次 `op`。它不会重试速率限制错误或
  其他失败。

仅授予服务账户对插件配置中所注册保管库和项目的读取权限。

## 开始之前

你需要：

- 在 Gateway 网关主机上安装 1Password CLI（`op`）
- 一个有权访问所选项目的 1Password 服务账户
- 一个专用的服务账户令牌文件

启用内置插件：

```bash
openclaw plugins enable onepassword
```

在 OpenClaw 状态目录下创建令牌目录和文件：

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

设置 `OPENCLAW_STATE_DIR` 后，请将 `~/.openclaw` 替换为该目录。
当令牌文件可被用户组或其他用户读取或写入时，插件会警告一次。

## 配置已注册的机密

将插件配置添加到 `openclaw.json`：

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

Slug 使用小写字母、数字和连字符，以字母或数字开头，
且长度不超过 64 个字符。一个注册表最多可包含 32 个
slug；描述最多可包含 200 个字符。`field` 接受一个字段
标签或 ID，不得包含逗号，默认值为 `credential`。
项目级 `vault` 会覆盖默认保管库。`opBin` 可设置
`op` 可执行文件的绝对路径；否则插件会从 `PATH` 中解析 `op`。
项目标题不得以连字符开头。

## 使用智能体工具

工具名称为 `onepassword`。

列出已注册的 slug：

```json
{ "action": "list" }
```

结果仅包含 slug、描述、策略以及长期授权是否有效。它绝不会包含
机密值，也不会查询 1Password。

请求一个机密：

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` 为必填项，不能为空，并且限制为 300 个字符。
成功的 `get` 会返回该值，以及所配置的 slug、项目标题和
字段标签。

## 策略层级和审批

- `auto`：立即获取并审计该请求。
- `deny`：阻止并审计该请求。
- `approve`：使用未过期的长期授权，或请求人工选择单次允许、
  始终允许或拒绝。

单次允许仅授权当前工具调用。始终允许会将该智能体和 slug 的长期
授权写入 SQLite；其他智能体必须分别获得审批。仅当调用方具有明确的智能体
身份时，OpenClaw 才会提供始终允许选项。授权在 `grantTtlHours` 后过期，
默认值为 720 小时。未解决或超时的审批会拒绝该请求；最长审批
等待时间为 600 秒。插件最多保留 1,024 个长期授权；达到该
上限时，最旧的授权会被逐出，其智能体必须审批下一次访问。

内存缓存默认为 300 秒，其范围受已配置的 slug 注册表限制。
将 `cacheTtlSeconds` 设置为 `0` 可禁用缓存。每次查找缓存前都会评估策略，
缓存命中也会被审计。运行时配置重新加载会在每个策略和执行边界生效；
禁用插件，或者移除、拒绝或重新定向 slug，都会使待处理的授权和
缓存值失效。

## 检查状态和审计历史记录

显示就绪状态和注册表计数：

```bash
openclaw onepassword status
```

此命令会报告令牌文件是否存在、`op` 是否已解析及其路径、
已注册项目数量以及各策略的数量。它绝不会读取或打印
令牌或机密值。

显示最近的 50 条审计记录：

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

记录按从新到旧的顺序排列，并显示时间戳、智能体、slug、结果以及截断的
原因。原因会按原样存储；代理绝不会将获取到的
值添加到审计日志中。

## 1Password CLI 行为

每次缓存未命中时，都会使用所配置的项目、保管库和精确的
字段选择器、JSON 输出、有界超时时间以及 `--cache=false` 运行 `op item get`。子进程
仅接收该字段，而不是完整项目。子进程环境中仅存在
`OP_SERVICE_ACCOUNT_TOKEN` 和 `HOME`。

插件只会尝试一次。对于 `RATE_LIMITED` 错误，应等待一段时间后
再发起后续智能体请求；插件不会创建自动重试
循环。其他稳定的错误代码用于区分令牌或二进制文件缺失、项目或字段缺失、
身份验证失败、超时以及其他 `op` 失败。
