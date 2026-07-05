---
read_when:
    - 你想要将 OpenClaw 连接到 Raft 工作区
    - 你正在配置一个 Raft 外部智能体
    - 你正在调试 Raft 唤醒投递
sidebarTitle: Raft
summary: 通过 Raft CLI 唤醒桥接支持 Raft External Agent
title: Raft
x-i18n:
    generated_at: "2026-07-05T11:04:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft 将 OpenClaw 智能体通过本地 Raft CLI 连接到 Raft 外部智能体。Raft 会向 Gateway 网关发送经过身份验证的唤醒提示；随后智能体使用 Raft CLI 检查和发送消息。仅支持直接聊天（不支持群组）。

## 安装

Raft 是官方外部插件。在 Gateway 网关主机上安装它：

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

详情：[插件](/zh-CN/tools/plugin)

## 前提条件

- 一个带有外部智能体的 Raft 工作区。
- Raft CLI 已安装在与 OpenClaw Gateway 网关相同的主机上，并位于服务的 `PATH` 中。
- 一个已经登录并关联到该外部智能体的 Raft CLI 配置文件。

该插件不存储 Raft 凭据；Raft CLI 会将该身份验证保存在自己的配置文件中。

## 配置

在配置中设置配置文件：

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

对于默认账号，你也可以改为在 Gateway 网关环境中设置 `RAFT_PROFILE`：

```bash
RAFT_PROFILE=openclaw
```

当一个 Gateway 网关连接到多个 Raft 外部智能体时，请使用命名账号：

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

交互式设置会记录相同的配置文件：

```bash
openclaw channels add --channel raft
```

## 工作原理

Gateway 网关启动时，插件会：

1. 在临时端口上打开一个仅限 loopback 的 HTTP 唤醒端点。
2. 使用该端点和按进程生成的令牌启动 `raft --profile <profile> agent bridge`。
3. 只接受来自本地 bridge 的、经过身份验证且不含内容的唤醒提示，并要求带有重放标识。
4. 要求每个唤醒载荷都包含 `eventId`、`attemptId`、`messageId`、`delivery_id`、`wake_id` 或 `id` 之一。
5. 按 bridge 事件 ID 对重试的唤醒投递去重，保留 24 小时，包括跨 Gateway 网关重启。
6. 为当前 bridge 返回稳定的运行时会话，并为 Raft CLI 协议返回空的活动排空批次。
7. 为每个被接受的唤醒启动一个串行化的 OpenClaw 智能体轮次。

bridge 负责 Raft 投递重试和重新连接。OpenClaw 轮次只接收唤醒通知，而不是复制的 Raft 消息正文。它使用 CLI 读取待处理消息并发送响应：

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft 不是推送消息传输通道。OpenClaw 不会自动通过 bridge 发回模型的最终文本，因此智能体必须在处理唤醒后使用 Raft CLI。
</Note>

## 验证

检查 OpenClaw 能否找到 CLI，并且已配置配置文件：

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

然后向 Raft 外部智能体发送一条消息。Gateway 网关日志应显示 Raft bridge 启动，随后出现入站唤醒。智能体应使用配置的 Raft 配置文件检查其待处理消息。

## 故障排查

<AccordionGroup>
  <Accordion title="Raft CLI 缺失">
    在 Gateway 网关主机上安装 Raft CLI，并让 `raft` 可通过服务的 `PATH` 访问。使用 `raft --help` 验证，然后重启 Gateway 网关。
  </Accordion>
  <Accordion title="bridge 立即退出">
    验证已配置的配置文件已登录，并且属于预期的 Raft 外部智能体。直接运行 `raft --profile <profile> agent bridge` 查看 CLI 诊断信息。
  </Accordion>
  <Accordion title="唤醒到达，但未发送 Raft 响应">
    如果智能体没有调用 Raft CLI，这是预期行为。唤醒 bridge 不携带消息正文，也不会自动发送最终回复。检查智能体的工具策略，并确保它可以运行 `raft --profile <profile>
    message check` 和 `message send`。
  </Accordion>
</AccordionGroup>

## 参考资料

- [Raft](https://raft.build/)
- [Raft 文档](https://docs.raft.build/welcome/)
- [Hermes Raft 集成](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
