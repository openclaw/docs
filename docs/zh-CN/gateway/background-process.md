---
read_when:
    - 添加或修改后台 exec 行为
    - 调试长时间运行的 exec 任务
summary: 后台 exec 执行与进程管理
title: 后台 exec 和进程工具
x-i18n:
    generated_at: "2026-04-27T10:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 15
---

# 后台 Exec + 进程工具

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保存在内存中。`process` 工具用于管理这些后台会话。

## exec 工具

关键参数：

- `command`（必填）
- `yieldMs`（默认 10000）：超过此延迟后自动转入后台
- `background`（布尔值）：立即转入后台
- `timeout`（秒，默认 `tools.exec.timeoutSec`）：在此超时后终止进程；仅当你想为该次调用禁用 exec 进程超时时，才设置 `timeout: 0`
- `elevated`（布尔值）：如果已启用/允许提升模式，则在沙箱外运行（默认为 `gateway`，当 exec 目标是 `node` 时则为 `node`）
- 需要真实的 TTY？设置 `pty: true`。
- `workdir`、`env`

行为：

- 前台运行会直接返回输出。
- 当转入后台时（显式指定或因超时），工具会返回 `status: "running"`、`sessionId` 和一小段尾部输出。
- 后台运行和 `yieldMs` 运行会继承 `tools.exec.timeoutSec`，除非调用提供了显式的 `timeout`。
- 输出会保留在内存中，直到该会话被轮询或清除。
- 如果 `process` 工具不被允许，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
- 已生成的 exec 命令会收到 `OPENCLAW_SHELL=exec`，用于支持具备上下文感知能力的 shell/profile 规则。
- 对于现在启动的长时间运行任务，只启动一次，然后依赖自动完成唤醒；当该功能已启用且命令产生输出或失败时，它会生效。
- 如果自动完成唤醒不可用，或者你需要确认某个无输出但已成功退出的命令确实已完成，请使用 `process` 来确认完成状态。
- 不要用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进；未来任务请使用 cron。

## 子进程桥接

当你在 exec/process 工具之外生成长时间运行的子进程时（例如 CLI 重启生成的进程或 Gateway 网关辅助进程），请挂载子进程桥接辅助工具，以便转发终止信号，并在退出/出错时移除监听器。这样可以避免在 systemd 下出现孤儿进程，并在各个平台上保持一致的关闭行为。

环境变量覆盖：

- `PI_BASH_YIELD_MS`：默认 yield（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：内存中输出上限（字符）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流待处理 stdout/stderr 的上限（字符）
- `PI_BASH_JOB_TTL_MS`：已完成会话的 TTL（毫秒，限制在 1 分钟到 3 小时之间）

配置（推荐）：

- `tools.exec.backgroundMs`（默认 10000）
- `tools.exec.timeoutSec`（默认 1800）
- `tools.exec.cleanupMs`（默认 1800000）
- `tools.exec.notifyOnExit`（默认 true）：当后台 exec 退出时，加入一个系统事件并请求心跳。
- `tools.exec.notifyOnExitEmptySuccess`（默认 false）：为 true 时，也会为那些成功完成但没有产生输出的后台运行加入完成事件。

## process 工具

操作：

- `list`：运行中 + 已完成的会话
- `poll`：提取某个会话的新输出（也会报告退出状态）
- `log`：读取聚合输出（支持 `offset` + `limit`）
- `write`：发送 stdin（`data`，可选 `eof`）
- `send-keys`：向 PTY 支持的会话发送显式按键令牌或字节
- `submit`：向 PTY 支持的会话发送 Enter / 回车
- `paste`：发送字面文本，可选择使用 bracketed paste mode 包裹
- `kill`：终止后台会话
- `clear`：从内存中移除已完成的会话
- `remove`：如果在运行则终止，否则如果已完成则清除

说明：

- 只有后台会话会在内存中列出/持久保存。
- 进程重启后会话会丢失（不会持久化到磁盘）。
- 只有当你运行 `process poll/log` 且工具结果被记录时，会话日志才会保存到聊天历史中。
- `process` 按智能体划分作用域；它只能看到由该智能体启动的会话。
- 当你需要状态、日志、安静成功确认，或在自动完成唤醒不可用时确认完成状态，请使用 `poll` / `log`。
- 当你需要输入或人工干预时，请使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含一个派生的 `name`（命令动词 + 目标），便于快速查看。
- `process log` 使用基于行的 `offset`/`limit`。
- 当 `offset` 和 `limit` 都省略时，它会返回最后 200 行，并包含分页提示。
- 当提供了 `offset` 但省略 `limit` 时，它会返回从 `offset` 到末尾的内容（不会限制为 200 行）。
- 轮询用于按需查看状态，不用于等待循环调度。如果任务应该稍后发生，请改用 cron。

## 示例

运行一个长任务，稍后轮询：

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

## 相关

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
