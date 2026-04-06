---
read_when:
    - 你正在将合成 QA 传输接入本地或 CI 测试运行
    - 你需要内置的 qa-channel 配置界面
    - 你正在迭代端到端 QA 自动化
summary: 用于确定性 OpenClaw QA 场景的合成 Slack 类渠道插件
title: QA 渠道
x-i18n:
    generated_at: "2026-04-06T16:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# QA 渠道

`qa-channel` 是一个为自动化 OpenClaw QA 提供的内置合成消息传输。

它不是生产渠道。它的存在是为了在保持状态可预测且完全可检查的同时，覆盖真实传输所使用的同一渠道插件边界。

## 当前功能

- Slack 类目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 基于 HTTP 的合成总线，用于：
  - 注入入站消息
  - 捕获出站转录
  - 创建线程
  - 反应
  - 编辑
  - 删除
  - 搜索和读取操作
- 内置的主机侧自检运行器，可写出 Markdown 报告

## 配置

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

支持的账户键名：

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## 运行器

当前的纵向切片：

```bash
pnpm qa:e2e
```

现在它会通过内置的 `qa-lab` 扩展进行路由。它会启动仓库内的 QA 总线，启动内置的 `qa-channel` 运行时切片，运行确定性的自检，并将 Markdown 报告写入 `.artifacts/qa-e2e/`。

私有调试器 UI：

```bash
pnpm qa:lab:up
```

这一条命令会构建 QA 站点，启动基于 Docker 的 Gateway 网关 + QA Lab 堆栈，并打印 QA Lab URL。你可以从该站点选择场景、选择模型通道、启动单次运行，并实时查看结果。

完整的仓库支持 QA 套件：

```bash
pnpm openclaw qa suite
```

它会在本地 URL 启动私有 QA 调试器，与已发布的 Control UI bundle 分开。

## 范围

当前范围有意保持狭窄：

- 总线 + 插件传输
- 线程化路由语法
- 渠道自有消息操作
- Markdown 报告
- 带有运行控制的基于 Docker 的 QA 站点

后续工作将添加：

- 提供商/模型矩阵执行
- 更丰富的场景发现
- 稍后提供 OpenClaw 原生编排
