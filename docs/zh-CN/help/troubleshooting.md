---
read_when:
    - OpenClaw 无法正常工作，而你需要最快的修复方法
    - 你希望在深入查看详细运行手册之前先执行分诊流程
summary: OpenClaw 症状优先故障排查中心
title: 常规故障排查
x-i18n:
    generated_at: "2026-07-11T20:38:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db50e0cdf4d11f3aa6196be445358d904a2b9c40c89243f1b124c77167f6dd85
    source_path: help/troubleshooting.md
    workflow: 16
---

故障分诊入口。用 2 分钟完成诊断，然后跳转到深入说明页面。

## 最初的六十秒

按顺序运行以下命令：

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

正常输出的要点，每项一行：

- `openclaw status` 显示已配置的渠道，且没有身份验证错误。
- `openclaw status --all` 生成完整、可共享的报告。
- `openclaw gateway probe` 显示 `Reachable: yes`。`Capability: ...` 是探测所证实的身份验证级别；`Read probe: limited - missing scope:
operator.read` 表示诊断能力受限，而不是连接失败。
- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe:
ok` 和合理的 `Capability: ...`。添加 `--require-rpc` 还可要求提供读取权限范围的 RPC 验证。
- `openclaw doctor` 未报告会造成阻塞的配置或服务错误。
- 当 Gateway 网关可访问时，`openclaw channels status --probe` 返回每个账号的实时传输状态（`works` / `audit ok`）；无法访问时，则回退到仅包含配置的摘要。
- `openclaw logs --follow` 显示活动稳定，没有反复出现的致命错误。

## 助手能力受限或缺少工具

检查实际生效的工具配置：

```bash
openclaw status
openclaw status --all
openclaw doctor
```

常见原因：

- `tools.profile: "minimal"` 仅允许使用 `session_status`。
- `tools.profile: "messaging"` 的范围较窄，适用于仅聊天的智能体。
- `tools.profile: "coding"` 是新建本地配置的默认值，适用于仓库、文件、Shell 和运行时工作。
- `tools.profile: "full"` 会移除配置限制；仅限由可信操作员控制的智能体使用。
- 每个智能体的 `agents.list[].tools` 可针对单个智能体收窄或扩展根配置。

更改配置，重启或重新加载 Gateway 网关，然后使用 `openclaw status --all` 再次检查。完整的配置/分组表：[工具配置](/zh-CN/gateway/config-tools#tool-profiles)。

## Anthropic 长上下文 429

`HTTP 429: rate_limit_error: Extra usage is required for long context requests`
→ [Anthropic 429：长上下文需要额外用量](/zh-CN/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

## 本地 OpenAI 兼容后端可直接使用，但在 OpenClaw 中失败

你的本地/自托管 `/v1` 后端可以响应直接的 `/v1/chat/completions` 探测，但在运行 `openclaw infer model run` 或正常的智能体轮次时失败：

1. 错误提到 `messages[].content` 应为字符串：设置
   `models.providers.<provider>.models[].compat.requiresStringContent: true`。
2. 仍然仅在 OpenClaw 智能体轮次中失败：设置
   `models.providers.<provider>.models[].compat.supportsTools: false`，然后重试。
3. 小型直接调用可以成功，但较大的 OpenClaw 提示词会导致后端崩溃：这是上游模型/服务器的限制，而不是 OpenClaw 缺陷。请继续参阅
   [本地 OpenAI 兼容后端可通过直接探测，但智能体运行失败](/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)。

## 安装插件时因缺少 openclaw extensions 而失败

`package.json missing openclaw.extensions` 表示插件包使用了 OpenClaw 不再接受的结构。

在插件包中修复：

1. 在 `package.json` 中添加 `openclaw.extensions`，指向构建后的运行时文件（通常为 `./dist/index.js`）。
2. 重新发布，然后再次运行 `openclaw plugins install <package>`。

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

## 安装策略阻止安装或更新插件

更新已完成，但插件仍然过时、被禁用，或者显示 `blocked by install
policy`、`install policy failed closed` 或 `Disabled "<plugin>" after plugin
update failure`：请检查 `security.installPolicy`。

安装策略会在安装和更新插件时运行。`@openclaw/*` 插件版本通常会随 OpenClaw 版本变更，因此 OpenClaw 更新后的同步过程可能需要更新到对应的插件版本。

除非你同时维护对应的升级规则，否则请避免使用以下策略结构：

- 将 OpenClaw 自有插件永久限定为某个确切的旧版本，例如只允许
  `@openclaw/*@2026.5.3`。
- 仅按来源类型进行阻止，例如阻止所有 npm、网络或 `request.mode:
"update"` 请求。
- 将策略命令视为可选项：启用 `security.installPolicy` 后，如果策略可执行文件缺失、运行缓慢、不可读或因权限而被阻止，系统会以拒绝方式关闭。
- 批准版本时，不将请求的 `openclawVersion` 与候选插件的元数据进行核对。

应优先采用允许可信 `@openclaw/*` 插件更新到与当前主机兼容版本的规则，而不是永久固定到某个版本。如果默认阻止 npm，请为你使用的插件 ID 添加范围严格的例外，并对 `request.mode: "update"` 和安装操作应用相同的信任规则。

恢复步骤：

```bash
openclaw doctor --deep
openclaw plugins update --all
openclaw status --all
```

如果策略有意设置得很严格，请在可信升级窗口内暂时放宽策略，重新运行 `openclaw plugins update --all`，然后恢复更严格的规则。如果更新失败导致插件被禁用，请在重新启用前进行检查：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
openclaw plugins enable <plugin-id>
```

参考：[操作员安装策略](/zh-CN/tools/skills-config#operator-install-policy-securityinstallpolicy)

## 插件存在，但因所有权可疑而被阻止

`openclaw doctor`、设置或启动警告显示：

```text
blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)
plugin present but blocked
```

插件文件的 Unix 所有者与加载这些文件的进程用户不同。不要删除插件配置；请修复文件所有权，或以状态目录所有者的身份运行 OpenClaw。

Docker 安装以 `node`（uid `1000`）身份运行。请修复主机绑定挂载的所有权：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

如果你有意以 root 身份运行 OpenClaw，请改为修复受管理插件根目录的所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

深入文档：[被阻止的插件路径所有权](/zh-CN/tools/plugin#blocked-plugin-path-ownership)、[Docker：权限和 EACCES](/zh-CN/install/docker#shell-helpers-optional)

## 决策树

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
```

<AccordionGroup>
  <Accordion title="无回复">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    正常输出：

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`、`write-capable` 或 `admin-capable`
    - 渠道显示传输已连接，并且在支持的情况下，`channels status --probe` 中显示 `works` 或 `audit ok`
    - 发送者已获批准（或私信策略设置为开放/允许列表）

    日志特征：

    - `drop guild message (mention required` → Discord 提及限制阻止了该消息。
    - `pairing request` → 发送者尚未获批，正在等待私信配对批准。
    - 渠道日志中的 `blocked` / `allowlist` → 发送者、房间或群组被过滤。

    深入页面：[无回复](/zh-CN/gateway/troubleshooting#no-replies)、[渠道故障排除](/zh-CN/channels/troubleshooting)、[配对](/zh-CN/channels/pairing)

  </Accordion>

  <Accordion title="仪表板或 Control UI 无法连接">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出：

    - `openclaw gateway status` 中显示 `Dashboard: http://...`
    - `Connectivity probe: ok`
    - `Capability: read-only`、`write-capable` 或 `admin-capable`
    - 日志中没有身份验证循环

    日志特征：

    - `device identity required` → HTTP/非安全上下文无法完成设备身份验证。
    - `origin not allowed` → 浏览器 `Origin` 不在 Control UI 的 Gateway 网关目标允许范围内。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 系统可能使用可信设备令牌自动重试一次，并复用已配对令牌缓存的权限范围。
    - 此次重试后仍反复出现 `unauthorized` → 令牌/密码错误、身份验证模式不匹配，或已配对的设备令牌已过期。
    - `too many failed authentication attempts (retry later)` → 来自该浏览器 `Origin` 的重复失败已触发临时锁定；其他 localhost 来源使用独立的限流桶。有关 Tailscale Serve 并发重试的细微差异，请参阅[仪表板/Control UI 连接](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)。
    - `gateway connect failed:` → UI 指向错误的 URL/端口，或 Gateway 网关不可访问。

    深入页面：[仪表板/Control UI 连接](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)、[Control UI](/zh-CN/web/control-ui)、[身份验证](/zh-CN/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway 网关无法启动，或服务已安装但未运行">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出：

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`、`write-capable` 或 `admin-capable`

    日志特征：

    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → Gateway 网关模式为远程，或配置缺少本地模式标记，需要修复。
    - `refusing to bind gateway ... without auth` → 绑定到非回环地址，但没有有效的身份验证路径（令牌/密码，或已配置情况下的可信代理）。
    - `another gateway instance is already listening` 或 `EADDRINUSE` → 端口已被占用。

    深入页面：[Gateway 网关服务未运行](/zh-CN/gateway/troubleshooting#gateway-service-not-running)、[后台进程](/zh-CN/gateway/background-process)、[配置](/zh-CN/gateway/configuration)

  </Accordion>

  <Accordion title="渠道已连接，但消息无法流转">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    正常输出：

    - 渠道传输已连接。
    - 配对/允许列表检查通过。
    - 在要求提及时，能够检测到提及。

    日志特征：

    - `mention required` → 群组提及限制阻止了处理。
    - `pairing` / `pending` → 私信发送者尚未获批。
    - `not_in_channel`、`missing_scope`、`Forbidden`、`401/403` → 渠道权限或令牌问题。

    深入页面：[渠道已连接但消息无法流转](/zh-CN/gateway/troubleshooting#channel-connected-messages-not-flowing)、[渠道故障排除](/zh-CN/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron 或 Heartbeat 未触发或未送达">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    正常输出：

    - `cron status` 显示调度器已启用，并有下一次唤醒时间。
    - `cron runs` 显示近期的 `ok` 条目。
    - Heartbeat 已启用，且处于活动时段内。

    日志特征：

    - `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
    - `heartbeat skipped` 原因 `quiet-hours` → 当前不在配置的活跃时段内。
    - `heartbeat skipped` 原因 `empty-heartbeat-file` → `HEARTBEAT.md` 存在，但仅包含空白、注释、标题、围栏或空清单框架。
    - `heartbeat skipped` 原因 `no-tasks-due` → 任务模式已启用，但尚无任务达到执行间隔。
    - `heartbeat skipped` 原因 `alerts-disabled` → `showOk`、`showAlerts` 和 `useIndicator` 均已关闭。
    - `requests-in-flight` → 主通道繁忙；Heartbeat 唤醒已推迟。
    - `unknown accountId` → Heartbeat 投递目标账户不存在。

    深入阅读：[Cron 和 Heartbeat 投递](/zh-CN/gateway/troubleshooting#cron-and-heartbeat-delivery)、[定时任务：故障排查](/zh-CN/automation/cron-jobs#troubleshooting)、[Heartbeat](/zh-CN/gateway/heartbeat)

  </Accordion>

  <Accordion title="节点已配对，但工具无法执行摄像头、画布、屏幕或 Exec 操作">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    正常输出：

    - 节点显示为已连接，并以 `node` 角色完成配对。
    - 你调用的命令具备对应能力。
    - 已授予该工具所需的权限。

    日志特征：

    - `NODE_BACKGROUND_UNAVAILABLE` → 将节点应用切换到前台。
    - `*_PERMISSION_REQUIRED` → 操作系统权限被拒绝或缺失。
    - `SYSTEM_RUN_DENIED: approval required` → Exec 审批正在等待处理。
    - `SYSTEM_RUN_DENIED: allowlist miss` → 命令不在 Exec 允许列表中。

    深入阅读：[节点已配对，但工具失败](/zh-CN/gateway/troubleshooting#node-paired-tool-fails)、[节点故障排查](/zh-CN/nodes/troubleshooting)、[Exec 审批](/zh-CN/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec 突然要求审批">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    发生的变化：

    - 未设置的 `tools.exec.host` 默认为 `auto`；存在沙箱运行时时解析为 `sandbox`，否则解析为 `gateway`。
    - `host=auto` 仅负责路由；不弹出提示的行为来自 Gateway 网关/节点上的 `security=full` 和 `ask=off`。
    - 未设置的 `tools.exec.security` 在 `gateway`/`node` 上默认为 `full`。
    - 未设置的 `tools.exec.ask` 默认为 `off`。
    - 如果你看到审批提示，说明某项主机本地策略或按会话策略已收紧 Exec 权限，使其偏离这些默认值。

    恢复当前无需审批的默认值：

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    更安全的替代方案：

    - 仅设置 `tools.exec.host=gateway`，以获得稳定的主机路由。
    - 使用 `security=allowlist` 和 `ask=on-miss`，让主机 Exec 在未命中允许列表时接受审核。
    - 启用沙箱模式，使 `host=auto` 重新解析为 `sandbox`。

    日志特征：

    - `Approval required.` → 命令正在等待 `/approve ...`。
    - `SYSTEM_RUN_DENIED: approval required` → 节点主机的 Exec 审批正在等待处理。
    - `exec host=sandbox requires a sandbox runtime for this session` → 隐式或显式选择了沙箱，但沙箱模式已关闭。

    深入阅读：[Exec](/zh-CN/tools/exec)、[Exec 审批](/zh-CN/tools/exec-approvals)、[安全：审计检查的内容](/zh-CN/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="浏览器工具失败">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    正常输出：

    - 浏览器状态显示 `running: true`，并显示已选择的浏览器/配置文件。
    - `openclaw` 配置文件可以启动，或 `user` 配置文件能看到本地 Chrome 标签页。

    日志特征：

    - `unknown command "browser"` → 已设置 `plugins.allow`，但其中不包含 `browser`。
    - `Failed to start Chrome CDP on port` → 本地浏览器启动失败。
    - `browser.executablePath not found` → 配置的二进制文件路径错误。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件中没有打开的本地 Chrome 标签页。
    - `Remote CDP for profile "<name>" is not reachable` → 无法从此主机访问配置的远程 CDP 端点。
    - `Browser attachOnly is enabled ... not reachable` → 仅附加配置文件没有可用的 CDP 目标。
    - 仅附加或远程 CDP 配置文件中存在过期的视口、深色模式、区域设置或离线覆盖设置 → 运行 `openclaw browser stop --browser-profile <name>` 关闭控制会话并释放模拟状态，无需重启 Gateway 网关。

    深入阅读：[浏览器工具失败](/zh-CN/gateway/troubleshooting#browser-tool-fails)、[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)、[浏览器：Linux 故障排查](/zh-CN/tools/browser-linux-troubleshooting)、[浏览器：WSL2/Windows 远程 CDP 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## 相关内容

- [常见问题](/zh-CN/help/faq) — 常见问题解答
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting) — Gateway 网关特有的问题
- [Doctor](/zh-CN/gateway/doctor) — 自动执行健康检查和修复
- [渠道故障排查](/zh-CN/channels/troubleshooting) — 渠道连接问题
- [定时任务：故障排查](/zh-CN/automation/cron-jobs#troubleshooting) — cron 和 Heartbeat 问题
