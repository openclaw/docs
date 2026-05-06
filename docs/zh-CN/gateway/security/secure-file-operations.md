---
read_when:
    - 更改文件访问、归档提取、工作区存储或插件文件系统辅助工具
summary: OpenClaw 如何安全地处理本地文件访问，以及为什么可选的 fs-safe Python 辅助工具默认关闭
title: 安全文件操作
x-i18n:
    generated_at: "2026-05-06T01:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 来处理安全敏感的本地文件操作：受根目录边界约束的读写、原子替换、归档解压、临时工作区、JSON 状态以及密钥文件处理。

目标是为接收不受信任路径名的可信 OpenClaw 代码提供一致的**库级防护边界**。它不是沙箱。主机文件系统权限、操作系统用户、容器以及智能体/工具策略仍然定义真正的影响范围。

## 默认：不使用 Python 辅助程序

OpenClaw 默认将 fs-safe POSIX Python 辅助程序设为**关闭**。

原因：

- Gateway 网关 不应启动持久 Python 辅助进程，除非操作员明确选择启用；
- 许多安装不需要额外的父目录变更加固；
- 禁用 Python 可让包/运行时行为在桌面、Docker、CI 和内置应用环境中更可预测。

OpenClaw 只更改默认值。如果你显式设置模式，fs-safe 会遵循该设置：

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用 fs-safe 名称也可使用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

## 没有 Python 时仍受保护的内容

在辅助程序关闭时，OpenClaw 仍使用 fs-safe 的 Node 路径来：

- 拒绝相对路径逃逸，例如 `..`、绝对路径，以及在只允许名称的位置出现路径分隔符；
- 通过可信根句柄解析操作，而不是使用临时的 `path.resolve(...).startsWith(...)` 检查；
- 在要求该策略的 API 上拒绝符号链接和硬链接模式；
- 在 API 返回或消费文件内容时，以身份检查方式打开文件；
- 对状态/配置文件执行原子同级临时文件写入；
- 对读取和归档解压设置字节限制；
- 在 API 要求时，对密钥和状态文件使用私有模式。

这些保护覆盖了常规 OpenClaw 威胁模型：可信 Gateway 网关代码在单一可信操作员边界内处理不受信任的模型/插件/渠道路径输入。

## Python 增加了什么

在 POSIX 上，fs-safe 的可选辅助程序会保留一个持久 Python 进程，并对父目录变更使用相对于 fd 的文件系统操作，例如 rename、remove、mkdir、stat/list，以及部分写入路径。

这会缩小同 UID 竞态窗口，避免另一个进程在验证与变更之间替换父目录。对于不受信任的本地进程可以修改 OpenClaw 正在操作的相同目录的主机，这是深度防御。

如果你的部署存在这种风险且可以保证 Python 存在，请使用：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

当辅助程序属于你的安全态势的一部分时，请使用 `require` 而不是 `auto`；如果辅助程序不可用，`auto` 会有意回退到仅 Node 行为。

## 插件和核心指南

- 面向插件的文件访问应通过 `openclaw/plugin-sdk/*` 辅助函数进行，而不是原始 `fs`，前提是路径来自消息、模型输出、配置或插件输入。
- 核心代码应使用 `src/infra/*` 下的本地 fs-safe 包装器，以便一致应用 OpenClaw 的进程策略。
- 归档解压应使用 fs-safe 归档辅助函数，并显式设置大小、条目数量、链接和目标位置限制。
- 密钥应使用 OpenClaw 密钥辅助函数或 fs-safe 密钥/私有状态辅助函数；不要围绕 `fs.writeFile` 手写模式检查。
- 如果你需要抵御恶意本地用户的隔离，不要只依赖 fs-safe。请在不同操作系统用户/主机下运行独立 Gateway 网关，或使用沙箱隔离。

相关：[安全](/zh-CN/gateway/security)、[沙箱隔离](/zh-CN/gateway/sandboxing)、[执行审批](/zh-CN/tools/exec-approvals)、[密钥](/zh-CN/gateway/secrets)。
