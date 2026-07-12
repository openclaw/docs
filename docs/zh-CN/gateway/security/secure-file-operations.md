---
read_when:
    - 更改文件访问、归档解压、工作区存储或插件文件系统辅助函数
summary: OpenClaw 如何安全处理本地文件访问，以及为何默认关闭可选的 fs-safe Python 辅助工具
title: 安全文件操作
x-i18n:
    generated_at: "2026-07-11T20:33:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 执行安全敏感的本地文件操作：限制在根目录内的读写、原子替换、归档解压、临时工作区、JSON 状态以及机密文件处理。

它是一个面向可信 OpenClaw 代码的**库级防护机制**，用于处理不可信的路径名称，并非沙箱。主机文件系统权限、操作系统用户、容器以及智能体/工具策略仍决定实际的影响范围。

## 默认：不使用 Python 辅助程序

OpenClaw 默认将 fs-safe 的 POSIX Python 辅助程序设为**关闭**：

- 除非操作员主动启用，否则 Gateway 网关不应生成持久运行的 Python 边车进程；
- 大多数安装不需要额外的父目录变更加固；
- 禁用 Python 可确保桌面端、Docker、CI 和内置应用环境中的运行时行为保持可预测。

OpenClaw 只更改_默认值_。显式设置始终优先：

```bash
# OpenClaw 默认行为：仅使用 Node 的 fs-safe 回退机制。
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# 在辅助程序可用时启用它，不可用时回退。
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# 如果辅助程序无法启动，则以失败关闭。
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# 可选的显式解释器路径。
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用的 fs-safe 环境变量名称也可用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

当辅助程序是你的安全策略的一部分时，请使用 `require`（而非 `auto`）；如果辅助程序无法启动，`auto` 会静默回退到仅使用 Node 的行为。

## 不使用 Python 时仍有哪些保护

关闭辅助程序后，OpenClaw 仍可获得 fs-safe 仅使用 Node 的防护机制：

- 拒绝相对路径逃逸（`..`）、绝对路径，以及仅允许裸名称时出现的路径分隔符；
- 通过可信根目录句柄解析操作，而不是使用临时拼凑的 `path.resolve(...).startsWith(...)` 检查；
- 对要求实施相关策略的 API，拒绝符号链接和硬链接模式；
- 当 API 返回或使用文件内容时，通过身份检查打开文件；
- 通过同级临时文件加重命名的方式原子写入状态/配置文件；
- 对读取和归档解压实施字节数限制；
- 在 API 要求时，为机密和状态文件应用私有文件模式。

这涵盖了 OpenClaw 的常规威胁模型：可信的 Gateway 网关代码在单一可信操作员边界内处理来自不可信模型、插件或渠道的路径输入。

## Python 增加了哪些保护

在 POSIX 上，可选辅助程序会保持一个持久运行的 Python 进程，并使用基于文件描述符的相对文件系统操作来变更父目录：重命名、删除、创建目录、获取状态/列出内容，以及部分写入路径。

这会缩小同一 UID 竞态窗口，即另一个进程在验证和变更之间替换父目录的风险——对于不可信本地进程能够修改 OpenClaw 所操作目录的主机，这是一种纵深防御措施。

如果你的部署存在此风险，并且能够保证 Python 可用，请设置：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## 插件和核心代码指南

- 当路径来自消息、模型输出、配置或插件输入时，面向插件的文件访问应通过 `openclaw/plugin-sdk/*` 辅助函数进行，而不是直接使用 `fs`。
- 核心代码应使用 `src/infra/*` 下的 fs-safe 封装，以便一致地应用 OpenClaw 的进程策略。
- 归档解压应使用 fs-safe 归档辅助函数，并显式设置大小、条目数量、链接和目标位置限制。
- 机密应使用 OpenClaw 机密辅助函数或 fs-safe 的机密/私有状态辅助函数；不要围绕 `fs.writeFile` 自行实现模式检查。
- 对于敌对本地用户隔离，不要仅依赖 fs-safe。应在不同的操作系统用户或主机下运行独立的 Gateway 网关，或使用沙箱隔离。

相关内容：[安全](/zh-CN/gateway/security)、[沙箱隔离](/zh-CN/gateway/sandboxing)、[Exec 审批](/zh-CN/tools/exec-approvals)、[机密](/zh-CN/gateway/secrets)。
