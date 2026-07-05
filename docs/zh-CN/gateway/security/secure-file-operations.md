---
read_when:
    - 更改文件访问、归档提取、工作区存储或插件文件系统辅助工具
summary: OpenClaw 如何安全处理本地文件访问，以及为什么可选的 fs-safe Python 辅助工具默认关闭
title: 安全文件操作
x-i18n:
    generated_at: "2026-07-05T11:20:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 执行安全敏感的本地文件操作：受根目录约束的读写、原子替换、归档提取、临时工作区、JSON 状态，以及密钥文件处理。

它是一个面向可信 OpenClaw 代码的**库级护栏**，用于处理不可信路径名，而不是沙箱。宿主文件系统权限、OS 用户、容器以及智能体/工具策略仍然定义真正的影响范围。

## 默认：不使用 Python helper

OpenClaw 默认将 fs-safe POSIX Python helper 设置为**关闭**：

- 除非操作员选择启用，否则 Gateway 网关不应生成持久 Python sidecar；
- 大多数安装不需要额外的父目录变更加固；
- 禁用 Python 可让桌面、Docker、CI 和内置应用环境中的运行时行为保持可预测。

OpenClaw 只更改_默认值_。显式设置始终优先：

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter path.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用的 fs-safe 环境变量名称也可用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

当 helper 是你的安全态势的一部分时，请使用 `require`（而不是 `auto`）；如果 helper 无法启动，`auto` 会静默回退到仅 Node 的行为。

## 没有 Python 时仍受保护的内容

关闭 helper 后，OpenClaw 仍会获得 fs-safe 的仅 Node 护栏：

- 拒绝相对路径逃逸（`..`）、绝对路径，以及在只允许裸名称的位置使用路径分隔符；
- 通过可信根句柄解析操作，而不是使用临时的 `path.resolve(...).startsWith(...)` 检查；
- 在要求该策略的 API 上拒绝符号链接和硬链接模式；
- 在 API 返回或消费文件内容的位置，使用身份检查打开文件；
- 通过原子同级临时文件 + 重命名写入状态/配置文件；
- 对读取和归档提取强制执行字节限制；
- 在 API 要求的位置，对密钥和状态文件应用私有文件模式。

这覆盖了 OpenClaw 的常规威胁模型：可信 Gateway 网关代码在单个可信操作员边界内处理不可信的模型/插件/渠道路径输入。

## Python 增加了什么

在 POSIX 上，可选 helper 会保留一个持久 Python 进程，并对父目录变更使用相对于 fd 的文件系统操作：重命名、删除、创建目录、stat/list，以及部分写入路径。

这缩小了同 UID 竞态窗口，即另一个进程在验证和变更之间替换父目录的情况——对于不可信本地进程可以修改 OpenClaw 操作目录的主机，这是纵深防御。

如果你的部署存在这种风险，并且可以保证 Python 存在，请设置：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## 插件和核心指南

- 面向插件的文件访问在路径来自消息、模型输出、配置或插件输入时，应通过 `openclaw/plugin-sdk/*` helper，而不是直接使用 `fs`。
- 核心代码应使用 `src/infra/*` 下的 fs-safe wrapper，以便一致应用 OpenClaw 的进程策略。
- 归档提取应使用 fs-safe 归档 helper，并显式设置大小、条目数、链接和目标限制。
- 密钥应使用 OpenClaw 密钥 helper 或 fs-safe 密钥/私有状态 helper；不要围绕 `fs.writeFile` 手写模式检查。
- 对于敌对本地用户隔离，不要只依赖 fs-safe。请在不同 OS 用户/主机下运行独立 Gateway 网关，或使用沙箱隔离。

相关：[安全](/zh-CN/gateway/security)、[沙箱隔离](/zh-CN/gateway/sandboxing)、[Exec 审批](/zh-CN/tools/exec-approvals)、[密钥](/zh-CN/gateway/secrets)。
