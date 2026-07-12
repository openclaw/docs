---
read_when:
    - 添加或修改后台 Exec 行为
    - 调试长时间运行的 Exec 任务
summary: 后台 Exec 执行和进程管理
title: 后台 Exec 和进程工具
x-i18n:
    generated_at: "2026-07-11T20:29:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保存在内存中。`process` 工具用于管理这些后台会话。

## Exec 工具

参数：

| 参数         | 说明                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | 必填。要运行的 shell 命令。                                                                                                                              |
| `workdir`    | 工作目录；省略时使用默认当前工作目录。                                                                                                                   |
| `env`        | 命令使用的额外环境变量。                                                                                                                                 |
| `yieldMs`    | 转入后台运行前等待的毫秒数（默认 10000）。                                                                                                               |
| `background` | 立即在后台运行。                                                                                                                                         |
| `timeout`    | 超时时间（秒，默认为 `tools.exec.timeoutSec`）；超时后终止进程。为该调用设置 `timeout: 0` 可禁用 Exec 进程超时。                                         |
| `pty`        | 在可用时通过伪终端运行（适用于需要 TTY 的 CLI、编码智能体）。                                                                                            |
| `elevated`   | 如果已启用或允许提升权限模式，则在沙箱外运行（默认为 `gateway`；当 Exec 目标为 `node` 时则为 `node`）。                                                   |
| `host`       | Exec 目标：`auto`、`sandbox`、`gateway` 或 `node`。                                                                                                      |
| `node`       | 节点 ID/名称，与 `host: "node"` 配合使用。                                                                                                               |

行为：

- 前台运行会直接返回输出。
- 转入后台运行时（显式指定或因 `yieldMs` 超时），工具会返回 `status: "running"`、`sessionId` 和一小段输出末尾内容。
- 后台运行和通过 `yieldMs` 转入后台的运行会继承 `tools.exec.timeoutSec`，除非调用显式传入 `timeout`。
- 输出会保留在内存中，直到轮询或清除会话。
- 如果不允许使用 `process` 工具，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
- 生成的 Exec 命令会收到 `OPENCLAW_SHELL=exec`，用于支持能够感知上下文的 shell/profile 规则。
- 对于现在启动的长时间运行工作：只启动一次，并在启用自动完成唤醒时，依靠命令产生输出或失败后触发的自动完成唤醒。
- 如果自动完成唤醒不可用，或者你需要确认某个无输出但正常退出的命令是否成功，请使用 `process` 轮询。
- 不要使用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进——未来的工作请使用 cron。

### 环境变量覆盖项

| 变量                                     | 作用                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 转入后台运行前的默认等待时间（毫秒）。默认为 10000，限制在 10–120000 之间。                                     |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 内存中输出的字符数上限。                                                                                        |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 每个流中待处理 stdout/stderr 的字符数上限。                                                                      |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 已完成会话的 TTL（毫秒），限制在 1 分钟至 3 小时之间。                                                          |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 将可写后台会话标记为可能正在等待输入之前的输出空闲阈值。默认为 15000。                                          |

### 配置（优先于环境变量覆盖项）

| 键                                    | 默认值  | 作用                                                                                 |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `tools.exec.backgroundMs`             | 10000   | 与 `OPENCLAW_BASH_YIELD_MS` 相同。                                                    |
| `tools.exec.timeoutSec`               | 1800    | 每次调用的默认超时时间。                                                             |
| `tools.exec.cleanupMs`                | 1800000 | 与 `OPENCLAW_BASH_JOB_TTL_MS` 相同。                                                  |
| `tools.exec.notifyOnExit`             | true    | 后台 Exec 退出时，将系统事件加入队列并请求 Heartbeat。                                |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 对无输出但成功完成的后台运行，也将完成事件加入队列。                                 |

## 子进程桥接

在 Exec/Process 工具之外生成长时间运行的子进程时（例如 CLI 重新生成的进程、Gateway 网关辅助进程），请附加子进程桥接辅助程序，以便转发终止信号，并在退出或出错时解除监听器。这可避免 systemd 中出现孤儿进程，并确保各平台的关闭行为一致。

## Process 工具

操作：

| 操作        | 作用                                                                              |
| ----------- | --------------------------------------------------------------------------------- |
| `list`      | 列出运行中和已完成的会话。                                                        |
| `poll`      | 获取会话的新输出（同时报告退出状态）。                                            |
| `log`       | 读取汇总输出和输入恢复提示。支持 `offset` + `limit`。                             |
| `write`     | 发送 stdin（`data`，可选 `eof`）。                                                |
| `send-keys` | 向由 PTY 支持的会话发送明确的按键令牌或字节。                                     |
| `submit`    | 向由 PTY 支持的会话发送 Enter/回车符。                                            |
| `paste`     | 发送原样文本，可选择使用括号粘贴模式包装。                                        |
| `kill`      | 终止后台会话。                                                                    |
| `clear`     | 从内存中移除已完成的会话。                                                        |
| `remove`    | 如果会话正在运行则将其终止，否则在已完成时将其清除。                              |

注意：

- 只有后台会话会被列出和保留——仅保存在内存中，不会写入磁盘。进程重启后会话会丢失。
- 在进程所有者确认实际退出之前，仍在运行的后台会话会阻止协作式主机挂起和 Gateway 网关安全重启。
- `process remove` 可以在请求终止后立即隐藏正在运行的会话；在确认退出之前，挂起和重启仍会被阻止。
- 只有运行 `process poll`/`log` 且工具结果被记录时，会话日志才会保存到聊天历史记录中。
- `process` 按智能体限定作用域；它只能看到由该智能体启动的会话。
- 自动完成唤醒不可用时，请使用 `poll`/`log` 获取状态、日志或完成确认。
- 恢复交互式 CLI 前请使用 `log`，以便同时查看当前记录、stdin 状态和输入等待提示。
- 需要输入或干预时，请使用 `write`/`send-keys`/`submit`/`paste`/`kill`。
- `process list` 包含派生的 `name`（命令动词 + 目标），便于快速浏览。
- 只有当会话仍有可写的 stdin，且空闲时间超过输入等待阈值（默认为 15000 毫秒，由 `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS` 设置）时，`process list`、`poll` 和 `log` 才会报告 `waitingForInput`。
- `process log` 使用基于行的 `offset`/`limit`。两者均省略时，它会返回最后 200 行并附带分页提示。设置 `offset` 但未设置 `limit` 时，它会返回从 `offset` 到末尾的内容（不受 200 行上限限制）。
- `poll` 的 `timeout` 会在返回前最多等待指定的毫秒数；超过 30000 的值会被限制为 30000。
- 轮询用于按需获取状态，而不是安排等待循环。如果工作应在未来执行，请使用 cron。

## 示例

运行一个长任务，稍后轮询：

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

粘贴原样文本：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
