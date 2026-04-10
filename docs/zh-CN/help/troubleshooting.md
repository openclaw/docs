---
read_when:
    - OpenClaw 无法正常工作，而你需要最快速的修复路径
    - 在深入查看详细操作手册之前，你想先走一遍分诊流程
summary: OpenClaw 的按症状分类故障排除中心
title: 常规故障排除
x-i18n:
    generated_at: "2026-04-10T20:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16b38920dbfdc8d4a79bbb5d6fab2c67c9f218a97c36bb4695310d7db9c4614a
    source_path: help/troubleshooting.md
    workflow: 15
---

# 故障排除

如果你只有 2 分钟，就把这个页面当作分诊入口。

## 最初的六十秒

按顺序运行这一组完全相同的命令：

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

一行概括“正常输出”：

- `openclaw status` → 显示已配置的渠道，且没有明显的认证错误。
- `openclaw status --all` → 提供完整报告，并且可以分享。
- `openclaw gateway probe` → 预期的 Gateway 网关目标可访问（`Reachable: yes`）。“`RPC: limited - missing scope: operator.read`”表示诊断能力受限，不是连接失败。
- `openclaw gateway status` → 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` → 没有阻塞性的配置或服务错误。
- `openclaw channels status --probe` → 如果 Gateway 网关可访问，会返回每个账户的实时传输状态，以及诸如 `works` 或 `audit ok` 之类的探测 / 审计结果；如果 Gateway 网关不可访问，该命令会回退为仅基于配置的摘要。
- `openclaw logs --follow` → 活动持续稳定，没有重复出现的致命错误。

## Anthropic 长上下文 429

如果你看到：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`，
请前往 [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

## 本地兼容 OpenAI 的后端可直接工作，但在 OpenClaw 中失败

如果你的本地或自托管 `/v1` 后端可以响应简短的直接
`/v1/chat/completions` 探测，但在 `openclaw infer model run` 或正常的智能体回合中失败：

1. 如果错误提到 `messages[].content` 期望为字符串，请设置
   `models.providers.<provider>.models[].compat.requiresStringContent: true`。
2. 如果该后端仍然只在 OpenClaw 智能体回合中失败，请设置
   `models.providers.<provider>.models[].compat.supportsTools: false`，然后重试。
3. 如果很小的直接调用仍然可用，但更大的 OpenClaw 提示词会导致后端崩溃，请将剩余问题视为上游模型 / 服务器限制，并继续查看详细操作手册：
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## 插件安装失败并提示缺少 openclaw extensions

如果安装失败并显示 `package.json missing openclaw.extensions`，说明该插件包仍在使用 OpenClaw 已不再接受的旧结构。

在插件包中修复：

1. 在 `package.json` 中添加 `openclaw.extensions`。
2. 将入口指向已构建的运行时文件（通常是 `./dist/index.js`）。
3. 重新发布插件，然后再次运行 `openclaw plugins install <package>`。

示例：

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

参考：[插件架构](/zh-CN/plugins/architecture)

## 决策树

```mermaid
flowchart TD
  A[OpenClaw 无法正常工作] --> B{首先是哪里出问题}
  B --> C[没有回复]
  B --> D[仪表板或 Control UI 无法连接]
  B --> E[Gateway 网关无法启动或服务未运行]
  B --> F[渠道已连接，但消息不流动]
  B --> G[Cron 或心跳未触发或未送达]
  B --> H[节点已配对，但 camera canvas screen exec 工具失败]
  B --> I[浏览器工具失败]

  C --> C1[/“没有回复”部分/]
  D --> D1[/“Control UI”部分/]
  E --> E1[/“Gateway 网关”部分/]
  F --> F1[/“渠道流转”部分/]
  G --> G1[/“自动化”部分/]
  H --> H1[/“节点工具”部分/]
  I --> I1[/“浏览器”部分/]
```

<AccordionGroup>
  <Accordion title="没有回复">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    正常输出应类似于：

    - `Runtime: running`
    - `RPC probe: ok`
    - 你的渠道显示传输已连接，并且在支持的情况下，`channels status --probe` 中会显示 `works` 或 `audit ok`
    - 发送方显示为已获准（或者私信策略为开放 / 允许列表）

    常见日志特征：

    - `drop guild message (mention required` → Discord 中的提及门控阻止了该消息。
    - `pairing request` → 发送方尚未获准，正在等待私信配对批准。
    - 渠道日志中的 `blocked` / `allowlist` → 发送方、房间或群组被过滤。

    详细页面：

    - [/gateway/troubleshooting#no-replies](/zh-CN/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
    - [/channels/pairing](/zh-CN/channels/pairing)

  </Accordion>

  <Accordion title="仪表板或 Control UI 无法连接">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出应类似于：

    - 在 `openclaw gateway status` 中显示 `Dashboard: http://...`
    - `RPC probe: ok`
    - 日志中没有认证循环

    常见日志特征：

    - `device identity required` → HTTP / 非安全上下文无法完成设备认证。
    - `origin not allowed` → 浏览器 `Origin` 不在 Control UI 的 Gateway 网关目标允许范围内。
    - 带有重试提示的 `AUTH_TOKEN_MISMATCH`（`canRetryWithDeviceToken=true`）→ 可能会自动执行一次受信任的设备令牌重试。
    - 该缓存令牌重试会复用与已配对设备令牌一起存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则会保留其请求的作用域集合。
    - 在异步 Tailscale Serve 的 Control UI 路径中，同一 `{scope, ip}` 的失败尝试会在限流器记录失败前被串行化，因此第二个并发的错误重试可能已经显示 `retry later`。
    - 来自 localhost 浏览器来源的 `too many failed authentication attempts (retry later)` → 来自同一 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源会使用单独的桶。
    - 在那次重试之后仍然反复出现 `unauthorized` → 错误的令牌 / 密码、认证模式不匹配，或已配对设备令牌过期。
    - `gateway connect failed:` → UI 正在指向错误的 URL / 端口，或 Gateway 网关不可达。

    详细页面：

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/zh-CN/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway 网关无法启动，或服务已安装但未运行">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出应类似于：

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    常见日志特征：

    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → Gateway 网关模式为 remote，或者配置文件缺少本地模式标记，需要修复。
    - `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径的情况下绑定到非 loopback 地址（令牌 / 密码，或按配置启用的受信任代理）。
    - `another gateway instance is already listening` 或 `EADDRINUSE` → 端口已被占用。

    详细页面：

    - [/gateway/troubleshooting#gateway-service-not-running](/zh-CN/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/zh-CN/gateway/background-process)
    - [/gateway/configuration](/zh-CN/gateway/configuration)

  </Accordion>

  <Accordion title="渠道已连接，但消息不流动">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出应类似于：

    - 渠道传输已连接。
    - 配对 / 允许列表检查通过。
    - 在要求提及的地方，提及已被识别。

    常见日志特征：

    - `mention required` → 群组中的提及门控阻止了处理。
    - `pairing` / `pending` → 私信发送方尚未获准。
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → 渠道权限令牌问题。

    详细页面：

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/zh-CN/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/zh-CN/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron 或心跳未触发或未送达">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    正常输出应类似于：

    - `cron.status` 显示为已启用，并有下一次唤醒时间。
    - `cron runs` 显示最近的 `ok` 条目。
    - 心跳已启用，并且不在活跃时间之外。

    常见日志特征：

    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - 带有 `reason=quiet-hours` 的 `heartbeat skipped` → 当前处于配置的活跃时间之外。
    - 带有 `reason=empty-heartbeat-file` 的 `heartbeat skipped` → `HEARTBEAT.md` 存在，但只包含空白 / 仅标题的脚手架内容。
    - 带有 `reason=no-tasks-due` 的 `heartbeat skipped` → `HEARTBEAT.md` 的任务模式已启用，但当前没有任何任务间隔到期。
    - 带有 `reason=alerts-disabled` 的 `heartbeat skipped` → 所有心跳可见性都已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）。
    - `requests-in-flight` → 主通道繁忙；心跳唤醒被延后。
    - `unknown accountId` → 心跳投递目标账户不存在。

    详细页面：

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/zh-CN/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/zh-CN/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/zh-CN/gateway/heartbeat)

    </Accordion>

    <Accordion title="节点已配对，但工具在 camera canvas screen exec 上失败">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      正常输出应类似于：

      - 节点列出为已连接，并已为 `node` 角色完成配对。
      - 你调用的命令所需能力存在。
      - 该工具的权限状态已授予。

      常见日志特征：

      - `NODE_BACKGROUND_UNAVAILABLE` → 将节点应用切换到前台。
      - `*_PERMISSION_REQUIRED` → 操作系统权限被拒绝或缺失。
      - `SYSTEM_RUN_DENIED: approval required` → exec 批准仍在等待中。
      - `SYSTEM_RUN_DENIED: allowlist miss` → 该命令不在 exec 允许列表中。

      详细页面：

      - [/gateway/troubleshooting#node-paired-tool-fails](/zh-CN/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)
      - [/tools/exec-approvals](/zh-CN/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec 突然要求批准">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      发生了什么变化：

      - 如果 `tools.exec.host` 未设置，则默认值是 `auto`。
      - `host=auto` 在启用沙箱运行时时会解析为 `sandbox`，否则解析为 `gateway`。
      - `host=auto` 只负责路由；无提示的 “YOLO” 行为来自于 gateway / node 上的 `security=full` 加 `ask=off`。
      - 在 `gateway` 和 `node` 上，未设置的 `tools.exec.security` 默认值为 `full`。
      - 未设置的 `tools.exec.ask` 默认值为 `off`。
      - 结果：如果你现在看到了批准提示，说明某些主机本地或按会话的策略，相比当前默认值收紧了 exec。

      恢复当前默认的无批准行为：

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      更安全的替代方案：

      - 如果你只是想要稳定的主机路由，只设置 `tools.exec.host=gateway`。
      - 如果你想使用主机 exec，但仍希望在允许列表未命中时进行审核，请使用 `security=allowlist` 搭配 `ask=on-miss`。
      - 如果你希望 `host=auto` 重新解析为 `sandbox`，请启用沙箱模式。

      常见日志特征：

      - `Approval required.` → 命令正在等待 `/approve ...`。
      - `SYSTEM_RUN_DENIED: approval required` → 节点主机 exec 批准仍在等待中。
      - `exec host=sandbox requires a sandbox runtime for this session` → 发生了隐式 / 显式的沙箱选择，但沙箱模式已关闭。

      详细页面：

      - [/tools/exec](/zh-CN/tools/exec)
      - [/tools/exec-approvals](/zh-CN/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/zh-CN/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="浏览器工具失败">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      正常输出应类似于：

      - 浏览器状态显示 `running: true`，并且已选定浏览器 / 配置文件。
      - `openclaw` 已启动，或者 `user` 可以看到本地 Chrome 标签页。

      常见日志特征：

      - `unknown command "browser"` 或 `unknown command 'browser'` → 已设置 `plugins.allow`，但其中不包含 `browser`。
      - `Failed to start Chrome CDP on port` → 本地浏览器启动失败。
      - `browser.executablePath not found` → 配置的二进制路径错误。
      - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议。
      - `browser.cdpUrl has invalid port` → 配置的 CDP URL 使用了错误或超出范围的端口。
      - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
      - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点从当前主机无法访问。
      - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可用的实时 CDP 目标。
      - attach-only 或远程 CDP 配置文件上的过期 viewport / 深色模式 / locale / offline 覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>` 以关闭当前控制会话并释放仿真状态，而无需重启 Gateway 网关。

      详细页面：

      - [/gateway/troubleshooting#browser-tool-fails](/zh-CN/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/zh-CN/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 常见问题
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting) — Gateway 网关特有的问题
- [Doctor](/zh-CN/gateway/doctor) — 自动化健康检查与修复
- [渠道故障排除](/zh-CN/channels/troubleshooting) — 渠道连接问题
- [自动化故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — cron 和心跳问题
