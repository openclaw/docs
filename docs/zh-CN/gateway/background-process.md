---
read_when:
    - 添加或修改后台 Exec 行为
    - 调试长时间运行的 Exec 任务
summary: 后台 Exec 执行和进程管理
title: 后台 Exec 和进程工具
x-i18n:
    generated_at: "2026-07-05T11:16:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4cd16585ee31038f5a9849add94ddc5056591d2f04523375b0a3f570a301c6
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保存在内存中。`process` 工具管理这些后台会话。

## exec 工具

参数：

| 参数         | 描述                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`    | 必填。要运行的 shell 命令。                                                                                                                                  |
| `workdir`    | 工作目录；省略则使用默认 cwd。                                                                                                                              |
| `env`        | 命令的额外环境变量。                                                                                                                                         |
| `yieldMs`    | 转入后台前等待的毫秒数（默认 10000）。                                                                                                                       |
| `background` | 立即在后台运行。                                                                                                                                             |
| `timeout`    | 超时时间（秒，默认 `tools.exec.timeoutSec`）；到期后终止进程。设置 `timeout: 0` 可为该次调用禁用 exec 进程超时。                                            |
| `pty`        | 在可用时通过伪终端运行（需要 TTY 的 CLI、编码智能体）。                                                                                                      |
| `elevated`   | 如果提升权限模式已启用/允许，则在沙箱外运行（默认是 `gateway`，或当 exec 目标为 `node` 时是 `node`）。                                                       |
| `host`       | Exec 目标：`auto`、`sandbox`、`gateway` 或 `node`。                                                                                                          |
| `node`       | 节点 ID/名称，与 `host: "node"` 配合使用。                                                                                                                   |

行为：

- 前台运行会直接返回输出。
- 转入后台时（显式指定或通过 `yieldMs` 超时），该工具会返回 `status: "running"` + `sessionId` 和一小段输出尾部。
- 后台运行和 `yieldMs` 运行会继承 `tools.exec.timeoutSec`，除非该调用传入显式 `timeout`。
- 输出会保留在内存中，直到会话被轮询或清除。
- 如果 `process` 工具被禁用，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
- 派生的 exec 命令会收到 `OPENCLAW_SHELL=exec`，用于上下文感知的 shell/profile 规则。
- 对于现在启动的长时间运行工作：只启动一次，并在命令产生输出或失败后依赖自动完成唤醒（如果已启用）。
- 如果自动完成唤醒不可用，或者你需要确认一个无输出但干净退出的命令是否静默成功，请用 `process` 轮询。
- 不要用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进 —— 未来工作请使用 cron。

### Env 覆盖项

| 变量                                     | 效果                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 转入后台前的默认等待时间（毫秒）。默认 10000，限制在 10-120000。                                               |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 内存中输出上限（字符）。                                                                                       |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 每个流的待处理 stdout/stderr 上限（字符）。                                                                    |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 已完成会话的 TTL（毫秒），限制为 1 分钟到 3 小时。                                                             |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 可写后台会话被标记为可能正在等待输入前的空闲输出阈值。默认 15000。                                            |

### 配置（优先于 env 覆盖项）

| 键                                    | 默认值  | 效果                                                                          |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | 与 `OPENCLAW_BASH_YIELD_MS` 相同。                                            |
| `tools.exec.timeoutSec`               | 1800    | 默认的每次调用超时时间。                                                      |
| `tools.exec.cleanupMs`                | 1800000 | 与 `OPENCLAW_BASH_JOB_TTL_MS` 相同。                                          |
| `tools.exec.notifyOnExit`             | true    | 后台 exec 退出时，排入系统事件并请求心跳。                                    |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 也为无输出的成功后台运行排入完成事件。                                        |

## 子进程桥接

在 exec/process 工具之外派生长时间运行的子进程时（CLI 重启、Gateway 网关辅助程序），请附加子进程桥接辅助程序，以便转发终止信号，并在退出/错误时分离监听器。这样可以避免 systemd 上出现孤立进程，并让跨平台关闭行为保持一致。

## process 工具

操作：

| 操作        | 效果                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| `list`      | 运行中 + 已完成的会话。                                                               |
| `poll`      | 排出某个会话的新输出（也会报告退出状态）。                                            |
| `log`       | 读取聚合输出和输入恢复提示。支持 `offset` + `limit`。                                 |
| `write`     | 发送 stdin（`data`，可选 `eof`）。                                                    |
| `send-keys` | 向 PTY 支持的会话发送显式按键 token 或字节。                                          |
| `submit`    | 向 PTY 支持的会话发送 Enter/回车。                                                    |
| `paste`     | 发送字面文本，可选用 bracketed paste 模式包装。                                       |
| `kill`      | 终止后台会话。                                                                        |
| `clear`     | 从内存中移除已完成会话。                                                              |
| `remove`    | 如果正在运行则终止，否则如果已完成则清除。                                            |

说明：

- 只有后台会话会被列出/持久保留 —— 仅在内存中，不在磁盘上。进程重启后会话会丢失。
- 只有在运行 `process poll`/`log` 且工具结果被记录时，会话日志才会保存到聊天历史中。
- `process` 按智能体划定范围；它只能看到该智能体启动的会话。
- 当自动完成唤醒不可用时，使用 `poll`/`log` 获取状态、日志或完成确认。
- 在恢复交互式 CLI 前使用 `log`，这样当前转录、stdin 状态和输入等待提示会一起可见。
- 需要输入或干预时，使用 `write`/`send-keys`/`submit`/`paste`/`kill`。
- `process list` 包含派生的 `name`（命令动词 + 目标），便于快速浏览。
- `process list`、`poll` 和 `log` 仅在会话仍有可写 stdin，且空闲时间超过输入等待阈值（默认 15000 毫秒，`OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`）时报告 `waitingForInput`。
- `process log` 使用基于行的 `offset`/`limit`。两者都省略时，它返回最后 200 行并附带分页提示。设置 `offset` 但未设置 `limit` 时，它返回从 `offset` 到末尾的内容（不会限制为 200 行）。
- `poll` 的 `timeout` 会在返回前最多等待指定毫秒数；超过 30000 的值会被限制为 30000。
- 轮询用于按需获取状态，不用于等待循环调度。如果工作应稍后发生，请使用 cron。

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

## 相关

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
