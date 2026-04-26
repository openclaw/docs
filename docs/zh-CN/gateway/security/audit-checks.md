---
read_when:
    - 你在 `openclaw security audit` 输出中看到了一个特定的 `checkId`，想知道它是什么意思
    - 你需要某个给定发现项的修复键名/路径
    - 你正在对一次安全审计运行中的严重性进行分类排查
summary: openclaw 安全审计发出的 checkId 参考目录
title: 安全审计检查
x-i18n:
    generated_at: "2026-04-26T00:16:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a5463bd1cec8382eb480cbbe1d8f8cceef0c15efc1f9124990df1e8f70b209a
    source_path: gateway/security/audit-checks.md
    workflow: 15
---

`openclaw security audit` 会输出以 `checkId` 为键的结构化发现项。本页是这些 ID 的参考目录。有关高层级威胁模型和加固指南，请参阅 [Security](/zh-CN/gateway/security)。

你在真实部署中最可能看到的高信号 `checkId` 值包括（并非穷尽）：

| `checkId`                                                     | 严重性 | 为什么重要 | 主要修复键名/路径 | 自动修复 |
| ------------------------------------------------------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | 严重   | 其他用户/进程可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_group_writable`                           | 警告   | 同组用户可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_readable`                                 | 警告   | 状态目录可被其他人读取 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.symlink`                                        | 警告   | 状态目录目标会变成另一个信任边界 | 状态目录文件系统布局 | 否 |
| `fs.config.perms_writable`                                    | 严重   | 其他人可以更改凭证/工具策略/配置 | `~/.openclaw/openclaw.json` 的文件系统权限 | 是 |
| `fs.config.symlink`                                           | 警告   | 不支持对符号链接配置文件进行写入，且会引入另一个信任边界 | 替换为常规配置文件，或将 `OPENCLAW_CONFIG_PATH` 指向真实文件 | 否 |
| `fs.config.perms_group_readable`                              | 警告   | 同组用户可以读取配置中的令牌/设置 | 配置文件的文件系统权限 | 是 |
| `fs.config.perms_world_readable`                              | 严重   | 配置可能暴露令牌/设置 | 配置文件的文件系统权限 | 是 |
| `fs.config_include.perms_writable`                            | 严重   | 配置包含文件可被其他人修改 | `openclaw.json` 引用的包含文件权限 | 是 |
| `fs.config_include.perms_group_readable`                      | 警告   | 同组用户可以读取被包含的密钥/设置 | `openclaw.json` 引用的包含文件权限 | 是 |
| `fs.config_include.perms_world_readable`                      | 严重   | 被包含的密钥/设置对所有人可读 | `openclaw.json` 引用的包含文件权限 | 是 |
| `fs.auth_profiles.perms_writable`                             | 严重   | 其他人可以注入或替换已存储的模型凭证 | `agents/<agentId>/agent/auth-profiles.json` 权限 | 是 |
| `fs.auth_profiles.perms_readable`                             | 警告   | 其他人可以读取 API 密钥和 OAuth 令牌 | `agents/<agentId>/agent/auth-profiles.json` 权限 | 是 |
| `fs.credentials_dir.perms_writable`                           | 严重   | 其他人可以修改渠道配对/凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.credentials_dir.perms_readable`                           | 警告   | 其他人可以读取渠道凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.sessions_store.perms_readable`                            | 警告   | 其他人可以读取会话转录内容/元数据 | 会话存储权限 | 是 |
| `fs.log_file.perms_readable`                                  | 警告   | 其他人可以读取虽经脱敏但仍然敏感的日志 | Gateway 网关日志文件权限 | 是 |
| `fs.synced_dir`                                               | 警告   | iCloud/Dropbox/Drive 中的状态/配置会扩大令牌/转录内容暴露范围 | 将配置/状态移出同步文件夹 | 否 |
| `gateway.bind_no_auth`                                        | 严重   | 远程绑定时未使用共享密钥 | `gateway.bind`, `gateway.auth.*` | 否 |
| `gateway.loopback_no_auth`                                    | 严重   | 经反向代理的 loopback 可能变为未鉴权状态 | `gateway.auth.*`, 代理设置 | 否 |
| `gateway.trusted_proxies_missing`                             | 警告   | 存在反向代理头，但未将代理标记为受信任 | `gateway.trustedProxies` | 否 |
| `gateway.http.no_auth`                                        | 警告/严重 | 在 `auth.mode="none"` 时，Gateway 网关 HTTP API 可被访问 | `gateway.auth.mode`, `gateway.http.endpoints.*` | 否 |
| `gateway.http.session_key_override_enabled`                   | 信息   | HTTP API 调用方可以覆盖 `sessionKey` | `gateway.http.allowSessionKeyOverride` | 否 |
| `gateway.tools_invoke_http.dangerous_allow`                   | 警告/严重 | 重新允许通过 HTTP API 使用危险工具 | `gateway.tools.allow` | 否 |
| `gateway.nodes.allow_commands_dangerous`                      | 警告/严重 | 启用高影响节点命令（相机/屏幕/联系人/日历/SMS） | `gateway.nodes.allowCommands` | 否 |
| `gateway.nodes.deny_commands_ineffective`                     | 警告   | 类似模式的拒绝项无法匹配 shell 文本或分组 | `gateway.nodes.denyCommands` | 否 |
| `gateway.tailscale_funnel`                                    | 严重   | 暴露到公共互联网 | `gateway.tailscale.mode` | 否 |
| `gateway.tailscale_serve`                                     | 信息   | 已通过 Serve 启用 Tailnet 暴露 | `gateway.tailscale.mode` | 否 |
| `gateway.control_ui.allowed_origins_required`                 | 严重   | 非 loopback 的 Control UI 未设置明确的浏览器源允许列表 | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.allowed_origins_wildcard`                 | 警告/严重 | `allowedOrigins=["*"]` 会禁用浏览器源允许列表 | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.host_header_origin_fallback`              | 警告/严重 | 启用 Host 头源回退（降低 DNS 重绑定加固强度） | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | 否 |
| `gateway.control_ui.insecure_auth`                            | 警告   | 已启用不安全鉴权兼容开关 | `gateway.controlUi.allowInsecureAuth` | 否 |
| `gateway.control_ui.device_auth_disabled`                     | 严重   | 禁用设备身份校验 | `gateway.controlUi.dangerouslyDisableDeviceAuth` | 否 |
| `gateway.real_ip_fallback_enabled`                            | 警告/严重 | 信任 `X-Real-IP` 回退可能因代理配置错误而允许伪造源 IP | `gateway.allowRealIpFallback`, `gateway.trustedProxies` | 否 |
| `gateway.token_too_short`                                     | 警告   | 共享令牌过短，更容易被暴力破解 | `gateway.auth.token` | 否 |
| `gateway.auth_no_rate_limit`                                  | 警告   | 暴露的鉴权接口若无限速，会增加暴力破解风险 | `gateway.auth.rateLimit` | 否 |
| `gateway.trusted_proxy_auth`                                  | 严重   | 代理身份现在成为鉴权边界 | `gateway.auth.mode="trusted-proxy"` | 否 |
| `gateway.trusted_proxy_no_proxies`                            | 严重   | 在没有受信任代理 IP 的情况下使用 trusted-proxy 鉴权并不安全 | `gateway.trustedProxies` | 否 |
| `gateway.trusted_proxy_no_user_header`                        | 严重   | trusted-proxy 鉴权无法安全解析用户身份 | `gateway.auth.trustedProxy.userHeader` | 否 |
| `gateway.trusted_proxy_no_allowlist`                          | 警告   | trusted-proxy 鉴权会接受任何已通过上游鉴权的用户 | `gateway.auth.trustedProxy.allowUsers` | 否 |
| `gateway.probe_auth_secretref_unavailable`                    | 警告   | 在此命令路径中，深度探测无法解析凭证 SecretRef | 深度探测凭证来源 / SecretRef 可用性 | 否 |
| `gateway.probe_failed`                                        | 警告/严重 | 实时 Gateway 网关探测失败 | Gateway 网关可达性/鉴权 | 否 |
| `discovery.mdns_full_mode`                                    | 警告/严重 | mDNS 完整模式会在本地网络中通告 `cliPath`/`sshPort` 元数据 | `discovery.mdns.mode`, `gateway.bind` | 否 |
| `config.insecure_or_dangerous_flags`                          | 警告   | 已启用任意不安全/危险的调试标志 | 多个键名（见发现详情） | 否 |
| `config.secrets.gateway_password_in_config`                   | 警告   | Gateway 网关密码直接存储在配置中 | `gateway.auth.password` | 否 |
| `config.secrets.hooks_token_in_config`                        | 警告   | Hook bearer 令牌直接存储在配置中 | `hooks.token` | 否 |
| `hooks.token_reuse_gateway_token`                             | 严重   | Hook 入口令牌同时也能解锁 Gateway 网关鉴权 | `hooks.token`, `gateway.auth.token` | 否 |
| `hooks.token_too_short`                                       | 警告   | Hook 入口更容易被暴力破解 | `hooks.token` | 否 |
| `hooks.default_session_key_unset`                             | 警告   | Hook 智能体运行会扇出到按请求生成的会话 | `hooks.defaultSessionKey` | 否 |
| `hooks.allowed_agent_ids_unrestricted`                        | 警告/严重 | 已鉴权的 Hook 调用方可路由到任意已配置智能体 | `hooks.allowedAgentIds` | 否 |
| `hooks.request_session_key_enabled`                           | 警告/严重 | 外部调用方可以选择 `sessionKey` | `hooks.allowRequestSessionKey` | 否 |
| `hooks.request_session_key_prefixes_missing`                  | 警告/严重 | 对外部会话键格式没有限制 | `hooks.allowedSessionKeyPrefixes` | 否 |
| `hooks.path_root`                                             | 严重   | Hook 路径为 `/`，更容易发生入口冲突或误路由 | `hooks.path` | 否 |
| `hooks.installs_unpinned_npm_specs`                           | 警告   | Hook 安装记录未固定到不可变的 npm 规格 | Hook 安装元数据 | 否 |
| `hooks.installs_missing_integrity`                            | 警告   | Hook 安装记录缺少完整性元数据 | Hook 安装元数据 | 否 |
| `hooks.installs_version_drift`                                | 警告   | Hook 安装记录与已安装包发生漂移 | Hook 安装元数据 | 否 |
| `logging.redact_off`                                          | 警告   | 敏感值会泄露到日志/Status | `logging.redactSensitive` | 是 |
| `browser.control_invalid_config`                              | 警告   | 浏览器控制配置在运行前即无效 | `browser.*` | 否 |
| `browser.control_no_auth`                                     | 严重   | 浏览器控制在没有令牌/密码鉴权的情况下暴露 | `gateway.auth.*` | 否 |
| `browser.remote_cdp_http`                                     | 警告   | 通过明文 HTTP 使用远程 CDP 缺少传输加密 | 浏览器配置文件 `cdpUrl` | 否 |
| `browser.remote_cdp_private_host`                             | 警告   | 远程 CDP 指向私有/内部主机 | 浏览器配置文件 `cdpUrl`, `browser.ssrfPolicy.*` | 否 |
| `sandbox.docker_config_mode_off`                              | 警告   | 沙箱 Docker 配置已存在但未激活 | `agents.*.sandbox.mode` | 否 |
| `sandbox.bind_mount_non_absolute`                             | 警告   | 相对绑定挂载可能以不可预测方式解析 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_bind_mount`                                | 严重   | 沙箱绑定挂载目标指向被阻止的系统、凭证或 Docker socket 路径 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_network_mode`                              | 严重   | 沙箱 Docker 网络使用 `host` 或 `container:*` 命名空间加入模式 | `agents.*.sandbox.docker.network` | 否 |
| `sandbox.dangerous_seccomp_profile`                           | 严重   | 沙箱 seccomp 配置文件削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.dangerous_apparmor_profile`                          | 严重   | 沙箱 AppArmor 配置文件削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.browser_cdp_bridge_unrestricted`                     | 警告   | 沙箱浏览器桥接暴露时未限制来源地址范围 | `sandbox.browser.cdpSourceRange` | 否 |
| `sandbox.browser_container.non_loopback_publish`              | 严重   | 现有浏览器容器在非 loopback 接口上发布 CDP | 浏览器沙箱容器发布配置 | 否 |
| `sandbox.browser_container.hash_label_missing`                | 警告   | 现有浏览器容器早于当前配置哈希标签 | `openclaw sandbox recreate --browser --all` | 否 |
| `sandbox.browser_container.hash_epoch_stale`                  | 警告   | 现有浏览器容器早于当前浏览器配置纪元 | `openclaw sandbox recreate --browser --all` | 否 |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | 警告   | 当沙箱关闭时，`exec host=sandbox` 会以关闭失败方式运行 | `tools.exec.host`, `agents.defaults.sandbox.mode` | 否 |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | 警告   | 当沙箱关闭时，按智能体配置的 `exec host=sandbox` 会以关闭失败方式运行 | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode` | 否 |
| `tools.exec.security_full_configured`                         | 警告/严重 | 主机 exec 正在使用 `security="full"` 运行 | `tools.exec.security`, `agents.list[].tools.exec.security` | 否 |
| `tools.exec.auto_allow_skills_enabled`                        | 警告   | Exec 审批会隐式信任 Skills 二进制文件 | `~/.openclaw/exec-approvals.json` | 否 |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | 警告   | 解释器允许列表允许内联求值，且未强制重新审批 | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec 审批允许列表 | 否 |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | 警告   | `safeBins` 中的解释器/运行时二进制文件若无显式配置文件，会扩大 exec 风险 | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*` | 否 |
| `tools.exec.safe_bins_broad_behavior`                         | 警告   | `safeBins` 中的广泛行为工具会削弱低风险 stdin 过滤信任模型 | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins` | 否 |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | 警告   | `safeBinTrustedDirs` 包含可变或高风险目录 | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs` | 否 |
| `skills.workspace.symlink_escape`                             | 警告   | 工作区 `skills/**/SKILL.md` 解析到工作区根目录之外（符号链接链漂移） | 工作区 `skills/**` 文件系统状态 | 否 |
| `plugins.extensions_no_allowlist`                             | 警告   | 安装插件时未设置显式插件允许列表 | `plugins.allowlist` | 否 |
| `plugins.installs_unpinned_npm_specs`                         | 警告   | 插件索引记录未固定到不可变的 npm 规格 | 插件安装元数据 | 否 |
| `plugins.installs_missing_integrity`                          | 警告   | 插件索引记录缺少完整性元数据 | 插件安装元数据 | 否 |
| `plugins.installs_version_drift`                              | 警告   | 插件索引记录与已安装包发生漂移 | 插件安装元数据 | 否 |
| `plugins.code_safety`                                         | 警告/严重 | 插件代码扫描发现可疑或危险模式 | 插件代码 / 安装来源 | 否 |
| `plugins.code_safety.entry_path`                              | 警告   | 插件入口路径指向隐藏目录或 `node_modules` 位置 | 插件清单 `entry` | 否 |
| `plugins.code_safety.entry_escape`                            | 严重   | 插件入口逃逸出插件目录 | 插件清单 `entry` | 否 |
| `plugins.code_safety.scan_failed`                             | 警告   | 插件代码扫描无法完成 | 插件路径 / 扫描环境 | 否 |
| `skills.code_safety`                                          | 警告/严重 | Skills 安装器元数据/代码包含可疑或危险模式 | Skills 安装来源 | 否 |
| `skills.code_safety.scan_failed`                              | 警告   | Skills 代码扫描无法完成 | Skills 扫描环境 | 否 |
| `security.exposure.open_channels_with_exec`                   | 警告/严重 | 共享/公开房间可以访问启用了 exec 的智能体 | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*` | 否 |
| `security.exposure.open_groups_with_elevated`                 | 严重   | 开放群组 + 提权工具会形成高影响提示注入路径 | `channels.*.groupPolicy`, `tools.elevated.*` | 否 |
| `security.exposure.open_groups_with_runtime_or_fs`            | 严重/警告 | 开放群组可以访问命令/文件工具，且没有沙箱/工作区防护 | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | 否 |
| `security.trust_model.multi_user_heuristic`                   | 警告   | 配置看起来像多用户场景，而 Gateway 网关信任模型仍是个人助手 | 拆分信任边界，或启用共享用户加固（`sandbox.mode`, 工具 deny/workspace 范围限定） | 否 |
| `tools.profile_minimal_overridden`                            | 警告   | 智能体覆盖配置绕过了全局最小权限配置文件 | `agents.list[].tools.profile` | 否 |
| `plugins.tools_reachable_permissive_policy`                   | 警告   | 扩展工具在宽松上下文中可被访问 | `tools.profile` + 工具 allow/deny | 否 |
| `models.legacy`                                               | 警告   | 仍配置了旧版模型家族 | 模型选择 | 否 |
| `models.weak_tier`                                            | 警告   | 已配置的模型低于当前推荐层级 | 模型选择 | 否 |
| `models.small_params`                                         | 严重/信息 | 小模型 + 不安全工具暴露面会提高注入风险 | 模型选择 + 沙箱/工具策略 | 否 |
| `summary.attack_surface`                                      | 信息   | 对鉴权、渠道、工具和暴露状况的汇总摘要 | 多个键名（见发现详情） | 否 |

## 相关内容

- [Security](/zh-CN/gateway/security)
- [Configuration](/zh-CN/gateway/configuration)
- [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)
