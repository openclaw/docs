---
read_when:
    - 添加或修改后台 exec 行为
    - 调试长时间运行的 exec 任务
summary: 后台 exec 执行和进程管理
title: 后台 Exec 和进程工具
x-i18n:
    generated_at: "2026-06-27T01:56:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保存在内存中。`process` 工具管理这些后台会话。

## exec 工具

关键参数：

- `command`（必需）
- `yieldMs`（默认 10000）：超过此延迟后自动转入后台
- `background`（bool）：立即转入后台
- `timeout`（秒，默认 `tools.exec.timeoutSec`）：超过此超时时间后终止进程；仅在需要为该次调用禁用 exec 进程超时时设置 `timeout: 0`
- `elevated`（bool）：如果提升权限模式已启用/允许，则在沙箱外运行（默认使用 `gateway`，或当 exec 目标为 `node` 时使用 `node`）
- 需要真实 TTY？设置 `pty: true`。
- `workdir`、`env`

行为：

- 前台运行会直接返回输出。
- 转入后台时（显式指定或超时），工具会返回 `status: "running"` + `sessionId` 和一小段尾部输出。
- 后台和 `yieldMs` 运行会继承 `tools.exec.timeoutSec`，除非调用提供了显式 `timeout`。
- 输出会保存在内存中，直到会话被轮询或清除。
- 如果 `process` 工具被禁用，`exec` 会同步运行并忽略 `yieldMs`/`background`。
- 派生的 exec 命令会收到 `OPENCLAW_SHELL=exec`，用于上下文感知的 shell/profile 规则。
- 对于现在启动的长时间运行任务，启动一次，并在启用自动完成唤醒且命令发出输出或失败时依赖它。
- 如果自动完成唤醒不可用，或者你需要确认某个无输出但干净退出的命令已安静成功，请使用 `process` 确认完成。
- 不要用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进；未来任务请使用 cron。

## 子进程桥接

在 exec/process 工具之外派生长时间运行的子进程时（例如 CLI 重启或 Gateway 网关辅助程序），请附加子进程桥接辅助程序，以便转发终止信号，并在退出/错误时分离监听器。这可以避免 systemd 上出现孤儿进程，并使各平台的关闭行为保持一致。

环境覆盖项：

- `OPENCLAW_BASH_YIELD_MS`：默认 yield（ms）
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`：内存内输出上限（字符数）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流的待处理 stdout/stderr 上限（字符数）
- `OPENCLAW_BASH_JOB_TTL_MS`：已完成会话的 TTL（ms，限制在 1m–3h）
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`：可写后台会话被标记为可能正在等待输入之前的空闲输出阈值（默认 15000 ms）

配置（首选）：

- `tools.exec.backgroundMs`（默认 10000）
- `tools.exec.timeoutSec`（默认 1800）
- `tools.exec.cleanupMs`（默认 1800000）
- `tools.exec.notifyOnExit`（默认 true）：后台 exec 退出时，将系统事件入队并请求 Heartbeat。
- `tools.exec.notifyOnExitEmptySuccess`（默认 false）：为 true 时，也会为未产生输出的成功后台运行入队完成事件。

## process 工具

操作：

- `list`：正在运行 + 已完成的会话
- `poll`：排出某个会话的新输出（也会报告退出状态）
- `log`：读取聚合输出并显示输入恢复提示（支持 `offset` + `limit`）
- `write`：发送 stdin（`data`，可选 `eof`）
- `send-keys`：向 PTY 支持的会话发送显式按键 token 或字节
- `submit`：向 PTY 支持的会话发送 Enter / 回车
- `paste`：发送字面文本，可选择用 bracketed paste 模式包装
- `kill`：终止后台会话
- `clear`：从内存中移除已完成会话
- `remove`：如果正在运行则终止，否则如果已完成则清除

说明：

- 只有后台会话会被列出/持久保存在内存中。
- 进程重启后会话会丢失（无磁盘持久化）。
- 只有在你运行 `process poll/log` 且工具结果被记录时，会话日志才会保存到聊天历史。
- `process` 按智能体限定范围；它只能看到由该智能体启动的会话。
- 当自动完成唤醒不可用时，使用 `poll` / `log` 获取状态、日志、安静成功确认或完成确认。
- 在恢复交互式 CLI 之前使用 `log`，以便同时看到当前 transcript、stdin 状态和输入等待提示。
- 当需要输入或干预时，使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含派生的 `name`（命令动词 + 目标），便于快速浏览。
- `process list`、`poll` 和 `log` 仅在会话仍有可写 stdin 且空闲时间超过输入等待阈值时报告 `waitingForInput`。
- `process log` 使用基于行的 `offset`/`limit`。
- 当同时省略 `offset` 和 `limit` 时，它会返回最后 200 行并包含分页提示。
- 当提供 `offset` 但省略 `limit` 时，它会返回从 `offset` 到末尾的内容（不限制为 200 行）。
- 轮询用于按需查看状态，而不是等待循环调度。如果工作应稍后发生，请改用 cron。

## 示例

运行长任务并稍后轮询：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

发送输入前检查交互式会话：

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
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

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
