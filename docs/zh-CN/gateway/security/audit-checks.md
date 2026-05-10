---
read_when:
    - 你在 `openclaw security audit` 输出中看到了一个特定的 `checkId`，并想知道它是什么意思
    - 你需要给定发现项的修复键/路径
    - 你正在对一次安全审计运行中的严重程度进行分诊
summary: openclaw security audit 输出的 checkIds 参考目录
title: 安全审计检查
x-i18n:
    generated_at: "2026-05-10T19:35:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: adc0fad7740fd20845ee0205d1a357fc6b6bd0d05fa9e97b6aa7403a94bbdb69
    source_path: gateway/security/audit-checks.md
    workflow: 16
---

`openclaw security audit` 会发出以 `checkId` 为键的结构化发现。本页是这些 ID 的参考目录。有关高层威胁模型和加固指南，请参阅[安全](/zh-CN/gateway/security)。

你最有可能在实际部署中看到的高信号 `checkId` 值（并非详尽无遗）：

| `checkId`                                                     | 严重程度      | 为什么重要                                                                       | 主要修复键/路径                                                                                 | 自动修复 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | 严重      | 其他用户/进程可以修改完整的 OpenClaw 状态                                 | `~/.openclaw` 的文件系统权限                                                                    | 是      |
| `fs.state_dir.perms_group_writable`                           | 警告          | 组用户可以修改完整的 OpenClaw 状态                                           | `~/.openclaw` 的文件系统权限                                                                    | 是      |
| `fs.state_dir.perms_readable`                                 | 警告          | 状态目录可被其他用户读取                                                      | `~/.openclaw` 的文件系统权限                                                                    | 是      |
| `fs.state_dir.symlink`                                        | 警告          | 状态目录目标会变成另一个信任边界                                      | 状态目录文件系统布局                                                                          | 否       |
| `fs.config.perms_writable`                                    | 严重      | 其他用户可以更改认证/工具策略/配置                                            | `~/.openclaw/openclaw.json` 的文件系统权限                                                      | 是      |
| `fs.config.symlink`                                           | 警告          | 不支持写入符号链接配置文件，并且会增加另一个信任边界     | 替换为常规配置文件，或将 `OPENCLAW_CONFIG_PATH` 指向真实文件                  | 否       |
| `fs.config.perms_group_readable`                              | 警告          | 组用户可以读取配置令牌/设置                                          | 配置文件的文件系统权限                                                                      | 是      |
| `fs.config.perms_world_readable`                              | 严重      | 配置可能暴露令牌/设置                                                    | 配置文件的文件系统权限                                                                      | 是      |
| `fs.config_include.perms_writable`                            | 严重      | 配置包含文件可被其他用户修改                                        | `openclaw.json` 引用的包含文件权限                                                   | 是      |
| `fs.config_include.perms_group_readable`                      | 警告          | 组用户可以读取被包含的密钥/设置                                       | `openclaw.json` 引用的包含文件权限                                                   | 是      |
| `fs.config_include.perms_world_readable`                      | 严重      | 被包含的密钥/设置可被所有用户读取                                         | `openclaw.json` 引用的包含文件权限                                                   | 是      |
| `fs.auth_profiles.perms_writable`                             | 严重      | 其他用户可以注入或替换已存储的模型凭证                                | `agents/<agentId>/agent/auth-profiles.json` 权限                                                    | 是      |
| `fs.auth_profiles.perms_readable`                             | 警告          | 其他用户可以读取 API key 和 OAuth 令牌                                            | `agents/<agentId>/agent/auth-profiles.json` 权限                                                    | 是      |
| `fs.credentials_dir.perms_writable`                           | 严重      | 其他用户可以修改渠道配对/凭证状态                                   | `~/.openclaw/credentials` 的文件系统权限                                                        | 是      |
| `fs.credentials_dir.perms_readable`                           | 警告          | 其他用户可以读取渠道凭证状态                                             | `~/.openclaw/credentials` 的文件系统权限                                                        | 是      |
| `fs.sessions_store.perms_readable`                            | 警告          | 其他用户可以读取会话转录/元数据                                         | 会话存储权限                                                                                  | 是      |
| `fs.log_file.perms_readable`                                  | 警告          | 其他用户可以读取已脱敏但仍敏感的日志                                    | Gateway 网关日志文件权限                                                                               | 是      |
| `fs.synced_dir`                                               | 警告          | iCloud/Dropbox/Drive 中的状态/配置会扩大令牌/转录暴露面              | 将配置/状态移出同步文件夹                                                                 | 否       |
| `gateway.bind_no_auth`                                        | 严重      | 未使用共享密钥的远程绑定                                                    | `gateway.bind`, `gateway.auth.*`                                                                     | 否       |
| `gateway.loopback_no_auth`                                    | 严重      | 反向代理的 local loopback 可能变成未认证                                  | `gateway.auth.*`, 代理设置                                                                        | 否       |
| `gateway.trusted_proxies_missing`                             | 警告          | 存在反向代理标头，但它们不受信任                                    | `gateway.trustedProxies`                                                                             | 否       |
| `gateway.http.no_auth`                                        | 警告/严重 | 可通过 `auth.mode="none"` 访问 Gateway 网关 HTTP API                                  | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                      | 否       |
| `gateway.http.session_key_override_enabled`                   | 信息          | HTTP API 调用方可以覆盖 `sessionKey`                                           | `gateway.http.allowSessionKeyOverride`                                                               | 否       |
| `gateway.tools_invoke_http.dangerous_allow`                   | 警告/严重 | 通过 HTTP API 重新启用危险工具                                             | `gateway.tools.allow`                                                                                | 否       |
| `gateway.nodes.allow_commands_dangerous`                      | 警告/严重 | 启用高影响节点命令（摄像头/屏幕/联系人/日历/SMS）              | `gateway.nodes.allowCommands`                                                                        | 否       |
| `gateway.nodes.deny_commands_ineffective`                     | 警告          | 类模式的拒绝条目不会匹配 shell 文本或组                          | `gateway.nodes.denyCommands`                                                                         | 否       |
| `gateway.tailscale_funnel`                                    | 严重      | 暴露到公网                                                             | `gateway.tailscale.mode`                                                                             | 否       |
| `gateway.tailscale_serve`                                     | 信息          | 已通过 Serve 启用 tailnet 暴露                                                | `gateway.tailscale.mode`                                                                             | 否       |
| `gateway.control_ui.allowed_origins_required`                 | 严重      | 非 loopback Control UI 未显式配置浏览器来源允许列表                    | `gateway.controlUi.allowedOrigins`                                                                   | 否       |
| `gateway.control_ui.allowed_origins_wildcard`                 | 警告/严重 | `allowedOrigins=["*"]` 会禁用浏览器来源允许列表                          | `gateway.controlUi.allowedOrigins`                                                                   | 否       |
| `gateway.control_ui.host_header_origin_fallback`              | 警告/严重 | 启用 Host 标头来源回退（降低 DNS 重绑定加固级别）              | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                         | 否       |
| `gateway.control_ui.insecure_auth`                            | 警告          | 已启用不安全认证兼容性开关                                           | `gateway.controlUi.allowInsecureAuth`                                                                | 否       |
| `gateway.control_ui.device_auth_disabled`                     | 严重      | 禁用设备身份检查                                                       | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                     | 否       |
| `gateway.real_ip_fallback_enabled`                            | 警告/严重 | 信任 `X-Real-IP` 回退可能因代理配置错误而允许源 IP 伪造      | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                              | 否       |
| `gateway.token_too_short`                                     | 警告          | 短共享令牌更容易被暴力破解                                          | `gateway.auth.token`                                                                                 | 否       |
| `gateway.auth_no_rate_limit`                                  | 警告          | 暴露的认证缺少速率限制会增加暴力破解风险                        | `gateway.auth.rateLimit`                                                                             | 否       |
| `gateway.trusted_proxy_auth`                                  | 严重      | 代理身份现在成为认证边界                                         | `gateway.auth.mode="trusted-proxy"`                                                                  | 否       |
| `gateway.trusted_proxy_no_proxies`                            | 严重      | 没有受信任代理 IP 的 trusted-proxy 认证不安全                               | `gateway.trustedProxies`                                                                             | 否       |
| `gateway.trusted_proxy_no_user_header`                        | 严重      | trusted-proxy 认证无法安全解析用户身份                               | `gateway.auth.trustedProxy.userHeader`                                                               | 否       |
| `gateway.trusted_proxy_no_allowlist`                          | 警告          | trusted-proxy 认证接受任意已认证的上游用户                           | `gateway.auth.trustedProxy.allowUsers`                                                               | 否       |
| `gateway.trusted_proxy_allow_loopback`                        | 警告          | 受信任代理认证接受显式允许的 loopback 代理来源                 | `gateway.auth.trustedProxy.allowLoopback`                                                            | 否       |
| `gateway.probe_auth_secretref_unavailable`                    | 警告          | 深度探测无法在此命令路径中解析认证 SecretRef                    | 深度探测认证来源 / SecretRef 可用性                                                      | 否       |
| `gateway.probe_failed`                                        | 警告/严重 | 实时 Gateway 网关探测失败                                                            | Gateway 网关可达性/认证                                                                            | 否       |
| `discovery.mdns_full_mode`                                    | 警告/严重 | mDNS 完整模式会在本地网络上通告 `cliPath`/`sshPort` 元数据              | `discovery.mdns.mode`, `gateway.bind`                                                                | 否       |
| `config.insecure_or_dangerous_flags`                          | 警告          | 已启用任何不安全/危险的调试标志                                           | 多个键名（见发现详情）                                                                   | 否       |
| `config.secrets.gateway_password_in_config`                   | 警告          | Gateway 网关密码直接存储在配置中                                        | `gateway.auth.password`                                                                              | 否       |
| `config.secrets.hooks_token_in_config`                        | 警告          | Hook bearer token 直接存储在配置中                                       | `hooks.token`                                                                                        | 否       |
| `hooks.token_reuse_gateway_token`                             | 严重      | Hook 入口 token 也会解锁 Gateway 网关认证                                         | `hooks.token`, `gateway.auth.token`                                                                  | 否       |
| `hooks.token_too_short`                                       | 警告          | Hook 入口更容易被暴力破解                                                   | `hooks.token`                                                                                        | 否       |
| `hooks.default_session_key_unset`                             | 警告          | Hook 智能体运行会扇出到生成的逐请求会话                          | `hooks.defaultSessionKey`                                                                            | 否       |
| `hooks.allowed_agent_ids_unrestricted`                        | 警告/严重 | 已认证的 Hook 调用方可以路由到任何已配置的智能体                         | `hooks.allowedAgentIds`                                                                              | 否       |
| `hooks.request_session_key_enabled`                           | 警告/严重 | 外部调用方可以选择 sessionKey                                                | `hooks.allowRequestSessionKey`                                                                       | 否       |
| `hooks.request_session_key_prefixes_missing`                  | 警告/严重 | 外部会话键形状没有限制                                              | `hooks.allowedSessionKeyPrefixes`                                                                    | 否       |
| `hooks.path_root`                                             | 严重      | Hook 路径为 `/`，使入口更容易冲突或误路由                       | `hooks.path`                                                                                         | 否       |
| `hooks.installs_unpinned_npm_specs`                           | 警告          | Hook 安装记录未固定到不可变的 npm 规格                           | Hook 安装元数据                                                                                | 否       |
| `hooks.installs_missing_integrity`                            | 警告          | Hook 安装记录缺少完整性元数据                                         | Hook 安装元数据                                                                                | 否       |
| `hooks.installs_version_drift`                                | 警告          | Hook 安装记录与已安装包发生偏移                                   | Hook 安装元数据                                                                                | 否       |
| `logging.redact_off`                                          | 警告          | 敏感值泄露到日志/Status                                                 | `logging.redactSensitive`                                                                            | 是      |
| `browser.control_invalid_config`                              | 警告          | 浏览器控制配置在运行时之前无效                                     | `browser.*`                                                                                          | 否       |
| `browser.control_no_auth`                                     | 严重      | 浏览器控制在没有 token/密码认证的情况下暴露                                  | `gateway.auth.*`                                                                                     | 否       |
| `browser.remote_cdp_http`                                     | 警告          | 通过普通 HTTP 使用远程 CDP 缺少传输加密                                | 浏览器配置文件 `cdpUrl`                                                                             | 否       |
| `browser.remote_cdp_private_host`                             | 警告          | 远程 CDP 指向私有/内部主机                                           | 浏览器配置文件 `cdpUrl`, `browser.ssrfPolicy.*`                                                     | 否       |
| `sandbox.docker_config_mode_off`                              | 警告          | 沙箱 Docker 配置存在但未启用                                           | `agents.*.sandbox.mode`                                                                              | 否       |
| `sandbox.bind_mount_non_absolute`                             | 警告          | 相对绑定挂载可能以不可预测的方式解析                                       | `agents.*.sandbox.docker.binds[]`                                                                    | 否       |
| `sandbox.dangerous_bind_mount`                                | 严重      | 沙箱绑定挂载目标为被阻止的系统、凭据或 Docker socket 路径        | `agents.*.sandbox.docker.binds[]`                                                                    | 否       |
| `sandbox.dangerous_network_mode`                              | 严重      | 沙箱 Docker 网络使用 `host` 或 `container:*` 命名空间加入模式              | `agents.*.sandbox.docker.network`                                                                    | 否       |
| `sandbox.dangerous_seccomp_profile`                           | 严重      | 沙箱 seccomp 配置文件削弱容器隔离                                  | `agents.*.sandbox.docker.securityOpt`                                                                | 否       |
| `sandbox.dangerous_apparmor_profile`                          | 严重      | 沙箱 AppArmor 配置文件削弱容器隔离                                 | `agents.*.sandbox.docker.securityOpt`                                                                | 否       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | 警告          | 沙箱浏览器桥接在没有来源范围限制的情况下暴露                   | `sandbox.browser.cdpSourceRange`                                                                     | 否       |
| `sandbox.browser_container.non_loopback_publish`              | 严重      | 现有浏览器容器在非 loopback 接口上发布 CDP                  | 浏览器沙箱容器发布配置                                                             | 否       |
| `sandbox.browser_container.hash_label_missing`                | 警告          | 现有浏览器容器早于当前配置哈希标签                       | `openclaw sandbox recreate --browser --all`                                                          | 否       |
| `sandbox.browser_container.hash_epoch_stale`                  | 警告          | 现有浏览器容器早于当前浏览器配置时期                     | `openclaw sandbox recreate --browser --all`                                                          | 否       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | 警告          | 当沙箱关闭时，`exec host=sandbox` 会失败关闭                                 | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | 否       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | 警告          | 当沙箱关闭时，逐智能体 `exec host=sandbox` 会失败关闭                       | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | 否       |
| `tools.exec.security_full_configured`                         | 警告/严重 | 主机 exec 正在以 `security="full"` 运行                                          | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | 否       |
| `tools.exec.fs_tools_disabled_but_exec_enabled`               | 警告          | 文件系统工具策略不会让 shell 执行变为只读                       | `tools.deny`, `agents.list[].tools.deny`, `agents.*.sandbox.workspaceAccess`                         | 否       |
| `tools.exec.auto_allow_skills_enabled`                        | 警告          | Exec 批准隐式信任技能 bin                                           | `~/.openclaw/exec-approvals.json`                                                                    | 否       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | 警告          | 解释器允许列表允许内联 eval，且不会强制重新批准                  | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec 批准允许列表 | 否       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | 警告          | `safeBins` 中没有显式配置文件的解释器/运行时 bin 会扩大 exec 风险   | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                    | 否       |
| `tools.exec.safe_bins_broad_behavior`                         | 警告          | `safeBins` 中的广泛行为工具会削弱低风险 stdin 过滤信任模型      | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                           | 否       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | 警告          | `safeBinTrustedDirs` 包含可变或有风险的目录                           | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                       | 否       |
| `skills.workspace.symlink_escape`                             | 警告          | 工作区 `skills/**/SKILL.md` 解析到工作区根目录之外（符号链接链偏移） | 工作区 `skills/**` 文件系统状态                                                               | 否       |
| `plugins.extensions_no_allowlist`                             | warn          | 插件是在没有显式插件允许列表的情况下安装的                           | `plugins.allowlist`                                                                                  | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | 插件索引记录未固定到不可变的 npm 规格                           | 插件安装元数据                                                                              | no       |
| `plugins.installs_missing_integrity`                          | warn          | 插件索引记录缺少完整性元数据                                         | 插件安装元数据                                                                              | no       |
| `plugins.installs_version_drift`                              | warn          | 插件索引记录与已安装的软件包不一致                                   | 插件安装元数据                                                                              | no       |
| `plugins.code_safety`                                         | warn/critical | 插件代码扫描发现可疑或危险模式                              | 插件代码 / 安装来源                                                                         | no       |
| `plugins.code_safety.entry_path`                              | warn          | 插件入口路径指向隐藏位置或 `node_modules` 位置                     | 插件清单 `entry`                                                                              | no       |
| `plugins.code_safety.entry_escape`                            | critical      | 插件入口逃逸出插件目录                                            | 插件清单 `entry`                                                                              | no       |
| `plugins.code_safety.scan_failed`                             | warn          | 插件代码扫描无法完成                                                  | 插件路径 / 扫描环境                                                                       | no       |
| `skills.code_safety`                                          | warn/critical | 技能安装器元数据/代码包含可疑或危险模式              | 技能安装来源                                                                                 | no       |
| `skills.code_safety.scan_failed`                              | warn          | 技能代码扫描无法完成                                                   | 技能扫描环境                                                                               | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | 共享/公开房间可以访问启用 exec 的智能体                                    | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`        | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | 开放群组 + 提权工具会产生高影响的提示注入路径               | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | 开放群组可以在没有沙箱/工作区保护的情况下访问命令/文件工具            | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`    | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | 配置看起来是多用户，而 Gateway 网关信任模型是个人助理              | 拆分信任边界，或进行共享用户加固（`sandbox.mode`、工具拒绝/工作区作用域限定）      | no       |
| `tools.profile_minimal_overridden`                            | warn          | 智能体覆盖绕过全局 minimal 配置文件                                        | `agents.list[].tools.profile`                                                                        | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | 插件工具在宽松上下文中可访问                                     | `tools.profile` + 工具允许/拒绝                                                                    | no       |
| `models.legacy`                                               | warn          | 仍配置了旧版模型系列                                           | 模型选择                                                                                      | no       |
| `models.weak_tier`                                            | warn          | 已配置的模型低于当前推荐层级                                | 模型选择                                                                                      | no       |
| `models.small_params`                                         | critical/info | 小模型 + 不安全的工具表面会提高注入风险                             | 模型选择 + 沙箱/工具策略                                                                   | no       |
| `summary.attack_surface`                                      | info          | 凭证、渠道、工具和暴露态势的汇总摘要                         | 多个键名（见发现详情）                                                                   | no       |

## 相关

- [安全](/zh-CN/gateway/security)
- [配置](/zh-CN/gateway/configuration)
- [可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)
