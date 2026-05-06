---
read_when:
    - 添加或修改后台执行行为
    - 调试长时间运行的 exec 任务
summary: 后台 exec 执行和进程管理
title: 后台执行和进程工具
x-i18n:
    generated_at: "2026-05-06T05:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保存在内存中。`process` 工具管理这些后台会话。

## `exec` 工具

关键参数：

- `command`（必需）
- `yieldMs`（默认 10000）：超过此延迟后自动转入后台
- `background`（bool）：立即在后台运行
- `timeout`（秒，默认 `tools.exec.timeoutSec`）：超过此超时后终止进程；仅在需要为该次调用禁用 exec 进程超时时设置 `timeout: 0`
- `elevated`（bool）：如果已启用/允许 elevated 模式，则在沙箱外运行（默认是 `gateway`，当 exec 目标为 `node` 时则为 `node`）
- 需要真实 TTY？设置 `pty: true`。
- `workdir`、`env`

行为：

- 前台运行会直接返回输出。
- 转入后台时（显式指定或超时），工具会返回 `status: "running"` + `sessionId` 以及简短尾部输出。
- 后台和 `yieldMs` 运行会继承 `tools.exec.timeoutSec`，除非调用提供了显式 `timeout`。
- 输出会保存在内存中，直到会话被轮询或清除。
- 如果不允许使用 `process` 工具，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
- 生成的 exec 命令会接收 `OPENCLAW_SHELL=exec`，用于上下文感知的 shell/profile 规则。
- 对于现在开始的长时间运行工作，启动一次，然后在启用自动完成唤醒且命令产生输出或失败时依赖它。
- 如果自动完成唤醒不可用，或者你需要确认某个无输出但已干净退出的命令是否静默成功，请使用 `process` 确认完成。
- 不要用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进；未来的工作请使用 cron。

## 子进程桥接

在 exec/process 工具之外生成长时间运行的子进程时（例如 CLI 重启或 Gateway 网关辅助进程），请附加子进程桥接辅助工具，以便转发终止信号，并在退出/错误时分离监听器。这样可避免 systemd 上出现孤儿进程，并让各平台的关闭行为保持一致。

环境覆盖项：

- `PI_BASH_YIELD_MS`：默认 yield（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：内存中输出上限（字符）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流的待处理 stdout/stderr 上限（字符）
- `PI_BASH_JOB_TTL_MS`：已完成会话的 TTL（毫秒，限制为 1 分钟–3 小时）

配置（推荐）：

- `tools.exec.backgroundMs`（默认 10000）
- `tools.exec.timeoutSec`（默认 1800）
- `tools.exec.cleanupMs`（默认 1800000）
- `tools.exec.notifyOnExit`（默认 true）：后台 exec 退出时，入队一个系统事件 + 请求 heartbeat。
- `tools.exec.notifyOnExitEmptySuccess`（默认 false）：为 true 时，也会为未产生输出的成功后台运行入队完成事件。

## `process` 工具

操作：

- `list`：正在运行 + 已完成的会话
- `poll`：排出某个会话的新输出（也会报告退出状态）
- `log`：读取聚合输出（支持 `offset` + `limit`）
- `write`：发送 stdin（`data`，可选 `eof`）
- `send-keys`：向 PTY 支持的会话发送显式按键令牌或字节
- `submit`：向 PTY 支持的会话发送 Enter / 回车
- `paste`：发送字面文本，可选包裹在 bracketed paste 模式中
- `kill`：终止后台会话
- `clear`：从内存中移除已完成的会话
- `remove`：如果正在运行则终止，否则如果已完成则清除

注意事项：

- 只有后台会话会被列出/持久保存在内存中。
- 进程重启后会话会丢失（没有磁盘持久化）。
- 只有在你运行 `process poll/log` 且工具结果被记录时，会话日志才会保存到聊天历史中。
- `process` 按智能体限定范围；它只能看到该智能体启动的会话。
- 在自动完成唤醒不可用时，使用 `poll` / `log` 获取状态、日志、静默成功确认或完成确认。
- 需要输入或干预时，使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含派生的 `name`（命令动词 + 目标），便于快速扫描。
- `process log` 使用基于行的 `offset`/`limit`。
- 当同时省略 `offset` 和 `limit` 时，它会返回最后 200 行，并包含分页提示。
- 当提供 `offset` 且省略 `limit` 时，它会从 `offset` 返回到末尾（不会限制为 200 行）。
- 轮询用于按需查看状态，而不是等待循环调度。如果工作应该稍后发生，请改用 cron。

## 示例

运行长任务并稍后轮询：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

立即在后台启动：

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

发送 stdin：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

发送 PTY 按键：

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

提交当前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴字面文本：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相关内容

- [`exec` 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
