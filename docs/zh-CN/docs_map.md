---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw 文档页面的已生成标题映射
title: 文档地图
x-i18n:
    generated_at: "2026-07-14T13:34:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5bfe9aed596249c3a1a00f96dec2725f2d54757980b06c5be64b0484d7854fc0
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw 文档地图

此文件根据 `docs/**/*.md` 和 `docs/**/*.mdx` 标题生成，帮助智能体浏览文档树。
请勿手动编辑；请运行 `pnpm docs:map:gen`。

## agent-runtime-architecture.md

- 路由：/agent-runtime-architecture
- 标题：
  - H2：运行时布局
  - H2：边界
  - H2：清单
  - H2：运行时选择
  - H2：相关内容

## announcements/bluebubbles-imessage.md

- 路由：/announcements/bluebubbles-imessage
- 标题：
  - H1：BlueBubbles removal and the imsg iMessage path
  - H2：变更内容
  - H2：操作方法
  - H2：迁移说明
  - H2：另请参阅

## auth-credential-semantics.md

- 路由：/auth-credential-semantics
- 标题：
  - H2：稳定的探测原因代码
  - H2：令牌凭证
  - H3：资格规则
  - H3：解析规则
  - H2：智能体副本可移植性
  - H2：仅配置的身份验证路由
  - H2：显式身份验证顺序过滤
  - H2：探测目标解析
  - H2：外部 CLI 凭证发现
  - H2：OAuth SecretRef 策略防护
  - H2：兼容旧版的消息传递
  - H2：相关内容

## automation/auth-monitoring.md

- 路由：/automation/auth-monitoring
- 标题：
  - H2：相关内容

## automation/clawflow.md

- 路由：/automation/clawflow
- 标题：
  - H2：相关内容

## automation/cron-jobs.md

- 路由：/automation/cron-jobs
- 标题：
  - H2：快速开始
  - H2：cron 的工作原理
  - H2：计划类型
  - H3：每月日期和每周日期使用 OR 逻辑
  - H2：事件触发器（条件监视器）
  - H2：负载
  - H3：智能体轮次选项
  - H3：命令负载
  - H2：执行方式
  - H2：交付和输出
  - H3：失败通知
  - H3：输出语言
  - H2：CLI 示例
  - H2：管理作业
  - H2：Webhooks
  - H3：身份验证
  - H2：Gmail PubSub 集成
  - H3：向导设置（推荐）
  - H3：Gateway 网关自动启动
  - H3：手动一次性设置
  - H3：Gmail 模型覆盖
  - H2：配置
  - H2：故障排查
  - H3：命令阶梯
  - H2：相关内容

## automation/cron-vs-heartbeat.md

- 路由：/automation/cron-vs-heartbeat
- 标题：
  - H2：相关内容

## automation/gmail-pubsub.md

- 路由：/automation/gmail-pubsub
- 标题：
  - H2：相关内容

## automation/hooks.md

- 路由：/automation/hooks
- 标题：
  - H2：选择合适的接口
  - H2：快速开始
  - H2：事件类型
  - H2：编写 Hooks
  - H3：Hook 结构
  - H3：HOOK.md 格式
  - H3：处理程序实现
  - H3：事件上下文要点
  - H2：Hook 发现
  - H3：Hook 包
  - H2：内置 Hooks
  - H3：session-memory 详情
  - H3：bootstrap-extra-files 配置
  - H3：command-logger 详情
  - H3：compaction-notifier 详情
  - H3：boot-md 详情
  - H2：插件钩子
  - H2：配置
  - H2：CLI 参考
  - H2：最佳实践
  - H2：故障排查
  - H3：未发现 Hook
  - H3：Hook 不符合条件
  - H3：Hook 未执行
  - H2：相关内容

## automation/index.md

- 路由：/automation
- 标题：
  - H2：快速决策指南
  - H3：定时任务（Cron）与 Heartbeat 对比
  - H2：核心概念
  - H3：定时任务（cron）
  - H3：任务
  - H3：推断式跟进承诺
  - H3：Task Flow
  - H3：常设指令
  - H3：Hooks
  - H3：Heartbeat
  - H2：它们如何协同工作
  - H2：相关内容

## automation/poll.md

- 路由：/automation/poll
- 标题：
  - H2：相关内容

## automation/standing-orders.md

- 路由：/automation/standing-orders
- 标题：
  - H2：为什么使用常设指令
  - H2：工作原理
  - H2：常设指令的组成
  - H2：常设指令与 cron 作业
  - H2：示例
  - H3：示例 1：内容和社交媒体（每周周期）
  - H3：示例 2：财务运营（事件触发）
  - H3：示例 3：监控和警报（持续）
  - H2：执行-验证-报告模式
  - H2：多程序架构
  - H2：最佳实践
  - H3：应做
  - H3：避免
  - H2：相关内容

## automation/taskflow.md

- 路由：/automation/taskflow
- 标题：
  - H2：何时使用 Task Flow
  - H2：同步模式
  - H3：托管模式
  - H3：镜像模式
  - H2：流程状态
  - H2：持久状态和修订跟踪
  - H2：取消行为
  - H2：CLI 命令
  - H2：可靠的定时工作流模式
  - H2：流程与任务的关系
  - H2：相关内容

## automation/tasks.md

- 路由：/automation/tasks
- 标题：
  - H2：简而言之
  - H2：快速开始
  - H2：任务的创建来源
  - H2：任务生命周期
  - H2：交付和通知
  - H3：通知策略
  - H2：CLI 参考
  - H2：聊天任务面板（/tasks）
  - H3：Control UI
  - H2：状态集成（任务压力）
  - H2：存储和维护
  - H3：任务的存储位置
  - H3：自动维护
  - H2：任务与其他系统的关系
  - H2：相关内容

## automation/troubleshooting.md

- 路由：/automation/troubleshooting
- 标题：
  - H2：相关内容

## automation/webhook.md

- 路由：/automation/webhook
- 标题：
  - H2：相关内容

## brave-search.md

- 路由：/brave-search
- 标题：
  - H2：相关内容

## channels/access-groups.md

- 路由：/channels/access-groups
- 标题：
  - H2：静态消息发送者组
  - H2：来自允许列表的引用组
  - H2：支持的消息渠道路径
  - H2：Discord 频道受众
  - H2：插件诊断
  - H2：安全说明
  - H2：故障排查

## channels/ambient-room-events.md

- 路由：/channels/ambient-room-events
- 标题：
  - H2：推荐设置
  - H2：变更内容
  - H2：Discord 示例
  - H2：Slack 示例
  - H2：Telegram 示例
  - H2：智能体特定策略
  - H2：可见回复模式
  - H2：历史记录
  - H2：故障排查
  - H2：相关内容

## channels/bot-loop-protection.md

- 路由：/channels/bot-loop-protection
- 标题：
  - H2：默认值
  - H2：配置共享默认值
  - H2：按渠道、账户或房间覆盖
  - H2：渠道支持

## channels/broadcast-groups.md

- 路由：/channels/broadcast-groups
- 标题：
  - H2：概览
  - H2：配置
  - H3：基本设置
  - H3：处理策略
  - H3：完整示例
  - H2：工作原理
  - H3：消息流
  - H3：会话隔离
  - H3：示例：隔离的会话
  - H2：使用场景
  - H2：最佳实践
  - H2：兼容性
  - H3：提供商
  - H3：路由
  - H2：故障排查
  - H2：示例
  - H2：API 参考
  - H3：配置架构
  - H3：字段
  - H2：限制
  - H2：相关内容

## channels/channel-routing.md

- 路由：/channels/channel-routing
- 标题：
  - H1：渠道和路由
  - H2：关键术语
  - H2：出站目标前缀
  - H2：会话键形式（示例）
  - H2：主私信路由固定
  - H2：受保护的入站记录
  - H2：路由规则（如何选择智能体）
  - H2：广播组（运行多个智能体）
  - H2：配置概览
  - H2：会话存储
  - H2：WebChat 行为
  - H2：回复上下文
  - H2：相关内容

## channels/clickclack.md

- 路由：/channels/clickclack
- 标题：
  - H2：快速设置
  - H3：账户配置键
  - H2：多个机器人
  - H2：回复模式
  - H2：持久媒体交付
  - H2：智能体活动行
  - H2：目标
  - H2：权限
  - H2：故障排查

## channels/discord.md

- 路由：/channels/discord
- 标题：
  - H2：快速设置
  - H2：推荐：设置公会工作区
  - H2：运行时模型
  - H2：论坛频道
  - H2：交互式组件
  - H2：访问控制和路由
  - H3：基于角色的智能体路由
  - H2：原生命令和命令身份验证
  - H2：功能详情
  - H2：工具和操作门控
  - H2：组件 v2 UI
  - H2：语音
  - H3：语音频道
  - H3：在语音中跟随用户
  - H3：语音消息
  - H2：故障排查
  - H2：配置参考
  - H2：安全和运维
  - H2：相关内容

## channels/feishu.md

- 路由：/channels/feishu
- 标题：
  - H2：快速开始
  - H2：访问控制
  - H3：私信
  - H3：群聊
  - H2：群组配置示例
  - H3：允许所有群组，无需 @提及
  - H3：允许所有群组，但仍要求 @提及
  - H3：仅允许特定群组
  - H3：限制群组内的发送者
  - H2：获取群组/用户 ID
  - H3：群组 ID（chatid，格式：ocxxx）
  - H3：用户 ID（openid，格式：ouxxx）
  - H2：常用命令
  - H2：故障排查
  - H3：Bot 在群聊中不响应
  - H3：Bot 未收到消息
  - H3：二维码设置在 Feishu 移动应用中无响应
  - H3：App Secret 泄露
  - H2：高级配置
  - H3：多个账户
  - H3：消息限制
  - H3：流式传输
  - H3：配额优化
  - H3：群组会话范围和话题线程
  - H3：Feishu 工作区工具
  - H3：ACP 会话
  - H4：持久 ACP 绑定
  - H4：从聊天中创建 ACP
  - H3：多智能体路由
  - H2：每用户 Agent 隔离（动态 Agent 创建）
  - H3：快速设置
  - H3：工作原理
  - H3：配置选项
  - H3：会话范围
  - H3：典型多用户部署
  - H3：验证
  - H3：注意事项
  - H2：配置参考
  - H2：支持的消息类型
  - H3：接收
  - H3：发送
  - H3：线程和回复
  - H2：相关内容

## channels/googlechat.md

- 路由：/channels/googlechat
- 标题：
  - H2：安装
  - H2：快速设置（初学者）
  - H2：添加到 Google Chat
  - H2：公共 URL（仅 Webhook）
  - H3：选项 A：Tailscale Funnel（推荐）
  - H3：选项 B：反向代理（Caddy）
  - H3：选项 C：Cloudflare Tunnel
  - H2：工作原理
  - H2：目标
  - H2：配置要点
  - H2：故障排查
  - H3：405 方法不允许
  - H3：其他问题
  - H2：相关内容

## channels/group-messages.md

- 路由：/channels/group-messages
- 标题：
  - H2：行为
  - H2：配置示例（WhatsApp）
  - H3：激活命令（仅所有者）
  - H2：使用方法
  - H2：测试/验证
  - H2：已知注意事项
  - H2：相关内容

## channels/groups.md

- 路由：/channels/groups
- 标题：
  - H2：初学者简介（2 分钟）
  - H2：可见回复
  - H2：上下文可见性和允许列表
  - H2：会话键
  - H2：模式：个人私信 + 公共群组（单一智能体）
  - H2：显示标签
  - H2：群组策略
  - H2：提及门控（默认）
  - H2：按范围配置提及模式
  - H2：群组/渠道工具限制（可选）
  - H2：群组允许列表
  - H2：激活（仅所有者）
  - H2：上下文字段
  - H2：iMessage 特有事项
  - H2：WhatsApp 系统提示词
  - H2：WhatsApp 特有事项
  - H2：相关内容

## channels/imessage-from-bluebubbles.md

- 路由：/channels/imessage-from-bluebubbles
- 标题：
  - H2：迁移检查清单
  - H2：imsg 的作用
  - H2：开始之前
  - H2：配置转换
  - H2：群组注册表陷阱
  - H2：分步操作
  - H2：操作对等性一览
  - H2：配对、会话和 ACP 绑定
  - H2：无回滚渠道
  - H2：相关内容

## channels/imessage.md

- 路由：/channels/imessage
- 标题：
  - H2：快速设置
  - H2：要求和权限（macOS）
  - H2：启用 imsg 私有 API
  - H3：设置
  - H3：SIP 保持启用时
  - H2：访问控制和路由
  - H2：ACP 对话绑定
  - H2：部署模式
  - H2：媒体、分块和投递目标
  - H2：私有 API 操作
  - H2：配置写入
  - H2：合并拆分发送的私信（在一次编写中包含命令 + URL）
  - H3：场景以及智能体所看到的内容
  - H2：桥接器或 Gateway 网关重启后的入站恢复
  - H3：操作员可见信号
  - H3：迁移
  - H2：故障排查
  - H2：配置参考指引
  - H2：相关内容

## channels/index.md

- 路由：/channels
- 标题：
  - H2：支持的渠道
  - H2：投递说明
  - H2：注意事项

## channels/irc.md

- 路由：/channels/irc
- 标题：
  - H2：快速开始
  - H2：连接设置
  - H2：安全默认值
  - H2：访问控制
  - H3：常见陷阱：allowFrom 用于私信，而非频道
  - H2：回复触发（提及）
  - H2：安全注意事项（建议用于公共频道）
  - H3：频道中的所有人使用相同工具
  - H3：每位发送者使用不同工具（所有者拥有更多权限）
  - H2：NickServ
  - H2：环境变量
  - H2：故障排查
  - H2：相关内容

## channels/line.md

- 路由：/channels/line
- 标题：
  - H2：安装
  - H2：设置
  - H2：配置
  - H2：访问控制
  - H2：消息行为
  - H2：渠道数据（富消息）
  - H2：ACP 支持
  - H2：出站媒体
  - H2：故障排查
  - H2：相关内容

## channels/location.md

- 路由：/channels/location
- 标题：
  - H2：文本格式
  - H2：上下文字段
  - H2：出站载荷
  - H2：渠道说明
  - H2：相关内容

## channels/matrix-migration.md

- 路由：/channels/matrix-migration
- 标题：
  - H2：迁移自动执行的操作
  - H2：从早于 2026.4 的 OpenClaw 版本升级
  - H2：推荐的升级流程
  - H2：常见消息及其含义
  - H3：手动恢复消息
  - H2：如果加密历史记录仍未恢复
  - H2：如果希望为后续消息重新开始
  - H2：相关内容

## channels/matrix-presentation.md

- 路由：/channels/matrix-presentation
- 标题：
  - H2：事件内容
  - H2：回退行为
  - H2：支持的区块
  - H2：交互
  - H2：与审批元数据的关系
  - H2：媒体消息

## channels/matrix-push-rules.md

- 路由：/channels/matrix-push-rules
- 标题：
  - H2：前提条件
  - H2：步骤
  - H2：多 Bot 注意事项
  - H2：主服务器注意事项
  - H2：相关内容

## channels/matrix.md

- 路由：/channels/matrix
- 标题：
  - H2：安装
  - H2：设置
  - H3：交互式设置
  - H3：最小配置
  - H3：自动加入
  - H3：允许列表目标格式
  - H3：账户 ID 规范化
  - H3：缓存的凭据
  - H3：环境变量
  - H2：配置示例
  - H2：流式预览
  - H2：语音消息
  - H2：审批元数据
  - H3：用于静默最终预览的自托管推送规则
  - H2：Bot 间房间
  - H2：加密和验证
  - H3：启用加密
  - H3：状态和信任信号
  - H3：使用恢复密钥验证此设备
  - H3：引导或修复交叉签名
  - H3：房间密钥备份
  - H3：列出、请求和响应验证
  - H3：多账户注意事项
  - H2：资料管理
  - H2：线程
  - H3：会话路由（sessionScope）
  - H3：回复线程化（threadReplies）
  - H3：线程继承和斜杠命令
  - H2：ACP 对话绑定
  - H3：线程绑定配置
  - H2：表情回应
  - H2：历史上下文
  - H2：上下文可见性
  - H2：私信和房间策略
  - H2：直接房间修复
  - H2：Exec 审批
  - H2：斜杠命令
  - H2：多账户
  - H2：私有/LAN 主服务器
  - H2：代理 Matrix 流量
  - H2：目标解析
  - H2：配置参考
  - H3：账户和连接
  - H3：加密
  - H3：访问和策略
  - H3：回复行为
  - H3：表情回应设置
  - H3：工具和按房间覆盖配置
  - H3：Exec 审批设置
  - H2：相关内容

## channels/mattermost.md

- 路由：/channels/mattermost
- 标题：
  - H2：安装
  - H2：快速设置
  - H2：原生斜杠命令
  - H2：环境变量（默认账户）
  - H2：聊天模式
  - H2：线程和会话
  - H2：访问控制（私信）
  - H2：频道（群组）
  - H2：出站投递目标
  - H2：私信渠道重试
  - H2：预览流式传输
  - H2：表情回应（消息工具）
  - H2：交互式按钮（消息工具）
  - H3：直接 API 集成（外部脚本）
  - H2：目录适配器
  - H2：多账户
  - H2：故障排查
  - H2：相关内容

## channels/msteams.md

- 路由：/channels/msteams
- 标题：
  - H2：内置插件
  - H2：快速设置
  - H2：目标
  - H2：配置写入
  - H2：访问控制（私信 + 群组）
  - H3：工作原理
  - H3：第 1 步：创建 Azure Bot
  - H3：第 2 步：获取凭据
  - H3：第 3 步：配置消息传递端点
  - H3：第 4 步：启用 Teams 渠道
  - H3：第 5 步：构建 Teams 应用清单
  - H3：第 6 步：配置 OpenClaw
  - H3：第 7 步：运行 Gateway 网关
  - H2：联合身份验证（证书加托管标识）
  - H3：选项 A：基于证书的身份验证
  - H3：选项 B：Azure 托管标识
  - H3：AKS 工作负载标识设置
  - H3：身份验证类型对比
  - H2：本地开发（隧道）
  - H2：测试 Bot
  - H2：环境变量
  - H2：成员信息操作
  - H2：历史上下文
  - H2：当前 Teams RSC 权限（清单）
  - H2：Teams 清单示例（已脱敏）
  - H3：清单注意事项（必需字段）
  - H3：更新现有应用
  - H2：能力：仅 RSC 与 Graph 对比
  - H3：仅使用 Teams RSC（已安装应用，无 Graph API 权限）
  - H3：使用 Teams RSC + Microsoft Graph 应用程序权限
  - H3：RSC 与 Graph API 对比
  - H2：启用 Graph 的媒体 + 历史记录
  - H3：频道/群组文件恢复（graphMediaFallback）
  - H2：已知限制
  - H3：Webhook 超时
  - H3：Teams 云和服务 URL 支持
  - H3：格式
  - H2：配置
  - H2：路由和会话
  - H2：回复样式：话题串与帖子
  - H3：解析优先级
  - H3：话题串上下文保留
  - H2：附件和图像
  - H2：在群聊中发送文件
  - H3：群聊为何需要 SharePoint
  - H3：设置
  - H3：共享行为
  - H3：回退行为
  - H3：文件存储位置
  - H2：投票（自适应卡片）
  - H2：呈现卡片
  - H2：目标格式
  - H2：主动消息传递
  - H2：团队和频道 ID（常见陷阱）
  - H2：专用频道
  - H2：故障排查
  - H3：常见问题
  - H3：清单上传错误
  - H3：RSC 权限不生效
  - H2：参考资料
  - H2：相关内容

## channels/nextcloud-talk.md

- 路由：/channels/nextcloud-talk
- 标题：
  - H2：安装
  - H2：快速设置（初学者）
  - H2：说明
  - H2：访问控制（私信）
  - H2：房间（群组）
  - H2：能力
  - H2：配置参考（Nextcloud Talk）
  - H2：相关内容

## channels/nostr.md

- 路由：/channels/nostr
- 标题：
  - H2：安装
  - H3：非交互式设置
  - H2：快速设置
  - H2：配置参考
  - H2：个人资料元数据
  - H2：访问控制
  - H3：私信策略
  - H3：允许列表示例
  - H2：密钥格式
  - H2：中继
  - H2：协议支持
  - H2：测试
  - H3：本地中继
  - H3：手动测试
  - H2：故障排查
  - H3：未收到消息
  - H3：未发送响应
  - H3：重复响应
  - H2：安全
  - H2：限制（MVP）
  - H2：相关内容

## channels/pairing.md

- 路由：/channels/pairing
- 标题：
  - H2：1）私信配对（入站聊天访问）
  - H3：批准发送者
  - H3：可复用的发送者群组
  - H3：状态存储位置
  - H2：2）节点设备配对（iOS/Android/macOS/无头节点）
  - H3：从 Control UI 配对（推荐）
  - H3：通过 Telegram 配对
  - H3：批准节点设备
  - H3：可选的受信任 CIDR 节点自动批准
  - H3：节点配对状态存储
  - H3：说明
  - H2：相关文档

## channels/qa-channel.md

- 路由：/channels/qa-channel
- 标题：
  - H2：功能
  - H2：配置
  - H2：运行器
  - H2：相关内容

## channels/qqbot.md

- 路由：/channels/qqbot
- 标题：
  - H2：安装
  - H2：设置
  - H2：配置
  - H3：流式传输
  - H3：访问策略
  - H3：多账户设置
  - H3：群聊
  - H3：语音（STT / TTS）
  - H2：目标格式
  - H2：斜杠命令
  - H2：媒体和存储
  - H2：故障排查
  - H2：相关内容

## channels/raft.md

- 路由：/channels/raft
- 标题：
  - H2：安装
  - H2：先决条件
  - H2：配置
  - H2：工作原理
  - H2：验证
  - H2：故障排查
  - H2：参考资料

## channels/reef.md

- 路由：/channels/reef
- 标题：
  - H2：快速开始
  - H2：智能体驱动的设置
  - H2：配置
  - H2：添加好友
  - H2：发送和接收
  - H2：防护措施和所有者审查
  - H2：故障排查

## channels/signal.md

- 路由：/channels/signal
- 标题：
  - H2：号码模型（请先阅读）
  - H2：安装
  - H2：快速设置
  - H2：简介
  - H2：设置路径 A：关联现有 Signal 账户（二维码）
  - H2：设置路径 B：注册专用 Bot 号码（SMS、Linux）
  - H2：外部守护进程模式（httpUrl）
  - H2：容器模式（bbernhard/signal-cli-rest-api）
  - H2：访问控制（私信 + 群组）
  - H2：工作原理（行为）
  - H2：媒体 + 限制
  - H2：正在输入状态 + 已读回执
  - H2：生命周期状态表情回应
  - H2：表情回应（消息工具）
  - H2：审批表情回应
  - H2：投递目标（CLI/cron）
  - H2：别名
  - H2：故障排查
  - H2：安全说明
  - H2：配置参考（Signal）
  - H2：相关内容

## channels/slack.md

- 路由：/channels/slack
- 标题：
  - H2：选择传输方式
  - H3：中继模式
  - H3：Enterprise Grid 组织范围安装
  - H4：Socket Mode
  - H4：HTTP Request URLs
  - H2：安装
  - H2：快速设置
  - H2：Socket Mode 传输调优
  - H2：清单和权限范围检查清单
  - H3：其他清单设置
  - H2：令牌模型
  - H2：操作和门控
  - H2：访问控制和路由
  - H2：话题串、会话和回复标签
  - H2：确认表情回应
  - H3：表情符号（ackReaction）
  - H3：范围（messages.ackReactionScope）
  - H2：文本流式传输
  - H2：正在输入表情回应回退
  - H2：语音输入
  - H2：媒体、分块和投递
  - H2：命令和斜杠行为
  - H2：原生图表
  - H2：原生表格
  - H2：交互式回复
  - H3：插件所有的模态框提交
  - H2：Slack 中的原生审批
  - H2：事件和运行行为
  - H2：配置参考
  - H2：故障排查
  - H2：附件媒体参考
  - H3：支持的媒体类型
  - H3：入站处理流水线
  - H3：话题串根消息附件继承
  - H3：多附件处理
  - H3：大小、下载和模型限制
  - H3：已知限制
  - H3：相关文档
  - H2：相关内容

## channels/sms.md

- 路由：/channels/sms
- 标题：
  - H2：开始之前
  - H2：快速开始
  - H2：配置示例
  - H3：配置文件
  - H3：环境变量
  - H3：SecretRef 身份验证令牌
  - H3：Messaging Service 发送者
  - H3：默认出站目标
  - H2：访问控制
  - H2：发送 SMS
  - H2：验证设置
  - H3：从 macOS iMessage/SMS 进行端到端测试
  - H2：Webhook 安全
  - H2：多账户配置
  - H2：故障排查
  - H3：Twilio 返回 403 或 OpenClaw 拒绝 Webhook
  - H3：未出现配对请求
  - H3：出站发送失败
  - H3：消息已到达，但智能体未回复

## channels/synology-chat.md

- 路由：/channels/synology-chat
- 标题：
  - H2：安装
  - H2：快速设置
  - H2：环境变量
  - H2：私信策略和访问控制
  - H2：出站投递
  - H2：多账户
  - H2：安全说明
  - H2：故障排查
  - H2：相关内容

## channels/telegram.md

- 路由：/channels/telegram
- 标题：
  - H2：快速设置
  - H2：Telegram 端设置
  - H2：仪表板小程序
  - H2：访问控制和激活
  - H3：群组 Bot 身份
  - H2：运行时行为
  - H2：功能参考
  - H2：错误回复控制
  - H2：故障排查
  - H2：配置参考
  - H2：相关内容

## channels/tlon.md

- 路由：/channels/tlon
- 标题：
  - H2：内置插件
  - H2：设置
  - H2：专用网络/局域网中的 ship
  - H2：群组频道
  - H2：访问控制
  - H2：所有者和审批系统
  - H2：自动接受设置
  - H2：通过 Urbit 设置存储热重载
  - H2：投递目标（CLI/cron）
  - H2：内置技能
  - H2：能力
  - H2：故障排查
  - H2：配置参考
  - H2：说明
  - H2：相关内容

## channels/troubleshooting.md

- 路由：/channels/troubleshooting
- 标题：
  - H2：命令阶梯
  - H2：更新后
  - H2：WhatsApp
  - H3：WhatsApp 故障特征
  - H2：Telegram
  - H3：Telegram 故障特征
  - H2：Discord
  - H3：Discord 故障特征
  - H2：Slack
  - H3：Slack 故障特征
  - H2：iMessage
  - H3：iMessage 故障特征
  - H2：Signal
  - H3：Signal 故障特征
  - H2：QQ Bot
  - H3：QQ Bot 故障特征
  - H2：Matrix
  - H3：Matrix 故障特征
  - H2：相关内容

## channels/twitch.md

- 路由：/channels/twitch
- 标题：
  - H2：安装
  - H2：快速设置
  - H2：功能简介
  - H2：令牌刷新（可选）
  - H2：多账户支持
  - H2：访问控制
  - H2：故障排查
  - H2：配置
  - H3：账户配置
  - H3：提供商选项
  - H2：工具操作
  - H2：安全与运维
  - H2：限制
  - H2：相关内容

## channels/wechat.md

- 路由：/channels/wechat
- 标题：
  - H2：命名
  - H2：工作原理
  - H2：安装
  - H2：登录
  - H2：访问控制
  - H2：兼容性
  - H2：辅助进程
  - H2：故障排查
  - H2：相关文档

## channels/whatsapp.md

- 路由：/channels/whatsapp
- 标题：
  - H2：安装
  - H2：快速设置
  - H2：部署模式
  - H2：运行时模型
  - H2：使用 MeowCaller 呼叫当前请求者（实验性）
  - H2：审批提示
  - H2：插件钩子与隐私
  - H2：访问控制与激活
  - H2：已配置的 ACP 绑定
  - H2：个人号码与自聊行为
  - H2：消息规范化与上下文
  - H2：投递、分块与媒体
  - H2：回复引用
  - H2：表情回应级别
  - H2：确认表情回应
  - H2：生命周期状态表情回应
  - H2：多账户与凭据
  - H2：工具、操作与配置写入
  - H2：故障排查
  - H2：系统提示词
  - H2：配置参考指引
  - H2：相关内容

## channels/yuanbao.md

- 路由：/channels/yuanbao
- 标题：
  - H2：快速开始
  - H3：交互式设置（替代方案）
  - H2：访问控制
  - H3：私信
  - H3：群聊
  - H2：配置示例
  - H2：常用命令
  - H2：故障排查
  - H2：高级配置
  - H3：多个账户
  - H3：消息限制
  - H3：流式传输
  - H3：群聊历史上下文
  - H3：回复目标模式
  - H3：Markdown 提示注入
  - H3：调试模式
  - H3：多智能体路由
  - H2：配置参考
  - H2：支持的消息类型
  - H2：相关内容

## channels/zalo.md

- 路由：/channels/zalo
- 标题：
  - H2：内置插件
  - H2：快速设置
  - H2：功能简介
  - H2：工作原理
  - H2：限制
  - H2：访问控制
  - H3：私信
  - H3：群组
  - H2：长轮询与 webhook 对比
  - H2：支持的消息类型
  - H2：能力
  - H2：投递目标（CLI/cron）
  - H2：故障排查
  - H2：配置参考
  - H2：相关内容

## channels/zaloclawbot.md

- 路由：/channels/zaloclawbot
- 标题：
  - H2：兼容性
  - H2：前提条件
  - H2：使用新手引导安装（推荐）
  - H2：手动安装
  - H3：1. 安装插件
  - H3：2. 在配置中启用插件
  - H3：3. 生成二维码并登录
  - H3：4. 重启 Gateway 网关
  - H2：工作原理
  - H2：底层机制
  - H2：故障排查
  - H2：相关内容

## channels/zalouser.md

- 路由：/channels/zalouser
- 标题：
  - H2：安装
  - H2：快速设置
  - H2：功能简介
  - H2：命名
  - H2：查找 ID（目录）
  - H2：限制
  - H2：访问控制（私信）
  - H2：群组访问（可选）
  - H3：群组提及门控
  - H2：多账户
  - H2：环境变量
  - H2：输入状态、表情回应与投递确认
  - H2：故障排查
  - H2：相关内容

## ci.md

- 路由：/ci
- 标题：
  - H2：流水线概览
  - H2：快速失败顺序
  - H2：PR 上下文与证据
  - H2：范围与路由
  - H2：ClawSweeper 活动转发
  - H2：手动触发
  - H2：运行器
  - H2：运行器注册预算
  - H2：本地等效命令
  - H2：OpenClaw 性能
  - H2：完整发布验证
  - H2：实时与 E2E 分片
  - H2：包验收
  - H3：作业
  - H3：候选来源
  - H3：测试套件配置
  - H3：旧版兼容窗口
  - H3：示例
  - H2：安装冒烟测试
  - H2：本地 Docker E2E
  - H3：可调参数
  - H3：可复用的实时/E2E 工作流
  - H3：发布路径分块
  - H2：插件预发布
  - H2：QA 实验室
  - H2：CodeQL
  - H3：安全类别
  - H3：特定平台安全分片
  - H3：关键质量类别
  - H2：维护工作流
  - H3：文档智能体
  - H3：测试性能智能体
  - H3：合并后的重复 PR
  - H2：本地检查门禁与变更路由
  - H2：Testbox 验证
  - H2：相关内容

## clawhub/cli.md

- 路由：/clawhub/cli
- 标题：
  - H1：ClawHub CLI
  - H2：发现与安装
  - H3：发布信任
  - H2：发布与维护
  - H2：相关内容

## clawhub/publishing.md

- 路由：/clawhub/publishing
- 标题：
  - H1：在 ClawHub 上发布
  - H2：所有者
  - H2：Skills
  - H2：插件
  - H2：发布流程
  - H2：常见问题
  - H3：包作用域必须与所选所有者匹配

## cli/acp.md

- 路由：/cli/acp
- 标题：
  - H2：不适用范围
  - H2：兼容性矩阵
  - H2：已知限制
  - H2：用法
  - H2：ACP 客户端（调试）
  - H2：协议冒烟测试
  - H2：使用方法
  - H2：选择智能体
  - H2：从 acpx 使用（Codex、Claude 及其他 ACP 客户端）
  - H2：Zed 编辑器设置
  - H2：会话映射
  - H2：选项
  - H3：acp 客户端选项
  - H2：相关内容

## cli/agent.md

- 路由：/cli/agent
- 标题：
  - H1：openclaw agent
  - H2：选项
  - H2：示例
  - H2：说明
  - H2：JSON 投递状态
  - H2：相关内容

## cli/agents.md

- 路由：/cli/agents
- 标题：
  - H1：openclaw agents
  - H2：示例
  - H2：命令界面
  - H3：agents list
  - H3：agents add [name]
  - H3：agents bindings
  - H3：agents bind
  - H3：agents unbind
  - H3：agents set-identity
  - H3：agents delete &lt;id&gt;
  - H2：路由绑定
  - H3：--bind 格式
  - H3：绑定范围行为
  - H2：身份文件
  - H2：设置身份
  - H2：相关内容

## cli/approvals.md

- 路由：/cli/approvals
- 标题：
  - H1：openclaw approvals
  - H2：openclaw exec-policy
  - H2：常用命令
  - H2：从文件替换审批配置
  - H2：“永不提示”/ YOLO 示例
  - H2：允许列表辅助工具
  - H2：常用选项
  - H2：说明
  - H2：相关内容

## cli/attach.md

- 路由：/cli/attach
- 标题：无

## cli/audit.md

- 路由：/cli/audit
- 标题：
  - H1：openclaw audit
  - H2：筛选器
  - H2：已记录事件
  - H2：Gateway RPC
  - H2：相关内容

## cli/backup.md

- 路由：/cli/backup
- 标题：
  - H1：openclaw backup
  - H2：说明
  - H2：SQLite 快照
  - H3：验证与恢复
  - H2：备份内容
  - H2：无效配置的处理行为
  - H2：大小与性能
  - H2：相关内容

## cli/browser.md

- 路由：/cli/browser
- 标题：
  - H1：openclaw browser
  - H2：常用标志
  - H2：快速开始（本地）
  - H2：快速故障排查
  - H2：生命周期
  - H2：命令缺失时
  - H2：配置文件
  - H2：标签页
  - H2：快照 / 截图 / 操作
  - H2：状态与存储
  - H2：调试
  - H2：通过 MCP 使用现有 Chrome
  - H2：远程浏览器控制（节点主机代理）
  - H2：相关内容

## cli/channels.md

- 路由：/cli/channels
- 标题：
  - H1：openclaw channels
  - H2：常用命令
  - H2：状态 / 能力 / 解析 / 日志
  - H2：添加 / 移除账户
  - H2：登录与退出登录（交互式）
  - H2：故障排查
  - H2：能力探测
  - H2：将名称解析为 ID
  - H2：相关内容

## cli/clawbot.md

- 路由：/cli/clawbot
- 标题：
  - H1：openclaw clawbot
  - H2：迁移
  - H2：相关内容

## cli/commitments.md

- 路由：/cli/commitments
- 标题：
  - H2：用法
  - H2：选项
  - H2：示例
  - H2：输出
  - H2：相关内容

## cli/completion.md

- 路由：/cli/completion
- 标题：
  - H1：openclaw completion
  - H2：用法
  - H2：选项
  - H2：安装流程
  - H2：说明
  - H2：相关内容

## cli/config.md

- 路由：/cli/config
- 标题：
  - H2：根选项
  - H2：示例
  - H3：路径
  - H3：config get
  - H3：config file
  - H3：config schema
  - H3：config validate
  - H2：值
  - H2：config set 模式
  - H3：提供商构建器标志
  - H2：config patch
  - H2：试运行
  - H3：JSON 输出结构
  - H2：应用更改
  - H2：写入安全
  - H2：修复循环
  - H2：相关内容

## cli/configure.md

- 路由：/cli/configure
- 标题：
  - H1：openclaw configure
  - H2：选项
  - H2：模型部分
  - H2：Web 部分
  - H2：其他说明
  - H2：相关内容

## cli/crestodian.md

- 路由：/cli/crestodian
- 标题：
  - H1：openclaw crestodian
  - H2：启动时机
  - H2：Crestodian 显示的内容
  - H2：示例
  - H2：操作与审批
  - H3：切换到脱敏渠道设置
  - H2：设置引导
  - H2：AI 对话
  - H3：CLI harness 信任模型
  - H2：切换到智能体
  - H2：消息抢救模式
  - H2：相关内容

## cli/cron.md

- 路由：/cli/cron
- 标题：
  - H1：openclaw cron
  - H2：快速创建任务
  - H2：会话
  - H2：递送
  - H3：递送所有权
  - H3：失败递送
  - H2：调度
  - H3：一次性任务
  - H3：周期性任务
  - H3：手动运行
  - H2：Models
  - H3：隔离 cron 模型的优先级
  - H3：快速模式
  - H3：实时模型切换重试
  - H2：运行输出与拒绝
  - H3：抑制过期确认
  - H3：抑制静默令牌
  - H3：结构化拒绝
  - H2：保留策略
  - H2：迁移旧任务
  - H2：常见编辑
  - H2：常用管理命令
  - H2：相关内容

## cli/daemon.md

- 路由：/cli/daemon
- 标题：
  - H1：openclaw daemon
  - H2：用法
  - H2：子命令和选项
  - H2：说明
  - H2：相关内容

## cli/dashboard.md

- 路由：/cli/dashboard
- 标题：
  - H1：openclaw dashboard
  - H2：机器可读输出
  - H2：相关内容

## cli/devices.md

- 路由：/cli/devices
- 标题：
  - H1：openclaw devices
  - H2：常用选项
  - H2：命令
  - H3：openclaw devices list
  - H3：openclaw devices approve [requestId] [--latest]
  - H3：openclaw devices reject &lt;requestId&gt;
  - H3：openclaw devices remove &lt;deviceId&gt;
  - H3：openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3：openclaw devices clear --yes [--pending]
  - H3：openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3：openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2：说明
  - H2：令牌漂移恢复检查清单
  - H2：Paperclip / openclawgateway 首次运行审批
  - H2：相关内容

## cli/directory.md

- 路由：/cli/directory
- 标题：
  - H1：openclaw directory
  - H2：常用标志
  - H2：说明
  - H2：将结果用于消息发送
  - H2：各渠道的 ID 格式
  - H2：自身（“me”）
  - H2：对等方（联系人/用户）
  - H2：群组
  - H2：相关内容

## cli/dns.md

- 路由：/cli/dns
- 标题：
  - H1：openclaw dns
  - H2：dns setup
  - H2：相关内容

## cli/docs.md

- 路由：/cli/docs
- 标题：
  - H1：openclaw docs
  - H2：用法
  - H2：示例
  - H2：工作原理
  - H2：输出
  - H2：退出代码
  - H2：相关内容

## cli/doctor.md

- 路由：/cli/doctor
- 标题：
  - H1：openclaw doctor
  - H2：运行方式
  - H2：示例
  - H2：选项
  - H2：Lint 模式
  - H2：结构化健康检查
  - H2：检查选择
  - H2：升级后模式
  - H2：共享状态 SQLite 压缩
  - H2：会话 SQLite 迁移
  - H3：会话 SQLite 迁移后降级
  - H2：说明
  - H2：macOS：launchctl 环境变量覆盖
  - H2：相关内容

## cli/fleet.md

- 路由：/cli/fleet
- 标题：
  - H1：openclaw fleet
  - H2：快速开始
  - H2：租户 ID
  - H2：fleet create
  - H3：创建选项
  - H3：按摘要固定
  - H3：磁盘限制
  - H3：出站策略
  - H2：fleet list
  - H2：fleet status
  - H2：fleet logs
  - H2：fleet start、fleet stop 和 fleet restart
  - H2：fleet upgrade
  - H2：fleet backup 和 fleet restore
  - H2：fleet doctor
  - H2：fleet rm
  - H2：存储和容器布局
  - H2：安全配置文件
  - H2：令牌处理
  - H2：相关内容

## cli/flows.md

- 路由：/cli/flows
- 标题：
  - H1：openclaw tasks flow
  - H2：子命令
  - H3：状态筛选值
  - H2：示例
  - H2：相关内容

## cli/gateway.md

- 路由：/cli/gateway
- 标题：
  - H2：运行 Gateway 网关
  - H3：选项
  - H2：重启 Gateway 网关
  - H3：Gateway 网关性能分析
  - H2：查询正在运行的 Gateway 网关
  - H3：gateway health
  - H3：gateway usage-cost
  - H3：gateway stability
  - H3：gateway diagnostics export
  - H3：gateway status
  - H3：gateway probe
  - H4：通过 SSH 远程访问（与 Mac 应用功能一致）
  - H3：gateway call &lt;method&gt;
  - H2：管理 Gateway 网关服务
  - H3：使用包装器安装
  - H2：发现 Gateway 网关（Bonjour）
  - H3：gateway discover
  - H2：相关内容

## cli/health.md

- 路由：/cli/health
- 标题：
  - H1：openclaw health
  - H2：选项
  - H2：行为
  - H2：相关内容

## cli/hooks.md

- 路由：/cli/hooks
- 标题：
  - H1：openclaw hooks
  - H2：列出 Hooks
  - H2：获取 Hook 信息
  - H2：检查适用条件
  - H2：启用 Hook
  - H2：禁用 Hook
  - H2：安装和更新 Hook 包
  - H2：内置 Hooks
  - H3：command-logger 日志文件
  - H2：说明
  - H2：相关内容

## cli/index.md

- 路由：/cli
- 标题：
  - H2：命令页面
  - H2：全局标志
  - H2：输出模式
  - H2：调色板
  - H2：命令树
  - H2：聊天斜杠命令
  - H2：用量跟踪
  - H2：相关内容

## cli/infer.md

- 路由：/cli/infer
- 标题：
  - H2：将 infer 转换为 Skill
  - H2：命令树
  - H2：常见任务
  - H2：行为
  - H2：模型
  - H2：图像
  - H2：音频
  - H2：TTS
  - H2：视频
  - H2：Web
  - H2：嵌入
  - H2：JSON 输出
  - H2：常见陷阱
  - H2：相关内容

## cli/logs.md

- 路由：/cli/logs
- 标题：
  - H1：openclaw logs
  - H2：选项
  - H2：共享 Gateway RPC 选项
  - H2：示例
  - H2：回退和恢复行为
  - H2：相关内容

## cli/mcp.md

- 路由：/cli/mcp
- 标题：
  - H2：选择合适的 MCP 路径
  - H2：将 OpenClaw 用作 MCP 服务器
  - H3：何时使用 serve
  - H3：工作原理
  - H3：选择客户端模式
  - H3：serve 公开的内容
  - H3：用法
  - H3：桥接工具
  - H3：事件模型
  - H3：Claude 渠道通知
  - H3：MCP 客户端配置
  - H3：选项
  - H3：安全与信任边界
  - H3：测试
  - H3：故障排除
  - H2：将 OpenClaw 用作 MCP 客户端注册表
  - H3：已保存的 MCP 服务器定义
  - H3：常用服务器配置方案
  - H3：JSON 输出结构
  - H3：Stdio 传输
  - H3：SSE / HTTP 传输
  - H3：OAuth 工作流
  - H3：可流式传输的 HTTP
  - H2：Control UI
  - H2：MCP 应用
  - H2：当前限制
  - H2：相关内容

## cli/memory.md

- 路由：/cli/memory
- 标题：
  - H1：openclaw memory
  - H2：memory status
  - H2：memory index
  - H2：memory search
  - H2：memory promote
  - H2：memory promote-explain
  - H2：memory rem-harness
  - H2：memory rem-backfill
  - H2：Dreaming
  - H2：SecretRef Gateway 网关依赖项
  - H2：相关内容

## cli/message.md

- 路由：/cli/message
- 标题：
  - H1：openclaw message
  - H2：渠道选择
  - H2：目标格式（-t、--target）
  - H2：常用标志
  - H2：SecretRef 解析
  - H2：操作
  - H3：核心
  - H3：发送
  - H3：投票
  - H3：话题串
  - H3：表情符号
  - H3：贴纸
  - H3：角色、频道、语音、事件（Discord）
  - H3：管理（Discord）
  - H3：广播
  - H2：相关内容

## cli/migrate.md

- 路由：/cli/migrate
- 标题：
  - H1：openclaw migrate
  - H2：命令
  - H2：安全模型
  - H2：Claude 提供商
  - H3：Claude 导入的内容
  - H3：归档和人工审查状态
  - H2：Codex 提供商
  - H3：Codex 导入的内容
  - H3：需人工审查的 Codex 状态
  - H2：Hermes 提供商
  - H3：Hermes 导入的内容
  - H3：支持的 .env 键
  - H3：仅归档状态
  - H3：应用后
  - H2：插件契约
  - H2：新手引导集成
  - H2：相关内容

## cli/models.md

- 路由：/cli/models
- 标题：
  - H1：openclaw models
  - H2：常用命令
  - H3：状态
  - H3：列表
  - H3：设置默认模型/图像模型
  - H3：扫描
  - H2：别名
  - H2：回退项
  - H2：身份验证配置文件
  - H2：相关内容

## cli/node.md

- 路由：/cli/node
- 标题：
  - H1：openclaw node
  - H2：为什么使用节点主机？
  - H2：浏览器代理（零配置）
  - H2：运行（前台）
  - H2：节点主机的 Gateway 网关身份验证
  - H2：服务（后台）
  - H2：配对
  - H3：身份和配对状态
  - H2：Exec 审批
  - H2：相关内容

## cli/nodes.md

- 路由：/cli/nodes
- 标题：
  - H1：openclaw nodes
  - H2：状态
  - H2：配对
  - H2：调用
  - H2：通知、推送、位置、屏幕
  - H2：相关内容

## cli/onboard.md

- 路由：/cli/onboard
- 标题：
  - H1：openclaw onboard
  - H2：示例
  - H2：引导流程
  - H2：重置
  - H2：区域设置
  - H2：非交互式设置
  - H3：Gateway 网关身份验证（非交互式）
  - H3：本地 Gateway 健康
  - H3：交互式引用模式
  - H3：Z.AI 端点选项
  - H2：其他非交互式标志
  - H2：提供商预筛选
  - H2：Web 搜索后续操作
  - H2：其他行为
  - H2：常用后续命令

## cli/pairing.md

- 路由：/cli/pairing
- 标题：
  - H1：openclaw pairing
  - H2：命令
  - H2：pairing list
  - H2：pairing approve
  - H3：所有者引导初始化
  - H2：相关内容

## cli/path.md

- 路由：/cli/path
- 标题：
  - H1：openclaw path
  - H2：为什么使用它
  - H2：使用方式
  - H2：工作原理
  - H2：子命令
  - H2：全局标志
  - H2：oc:// 语法
  - H2：按文件类型寻址
  - H2：变更契约
  - H2：示例
  - H2：按文件类型分类的用法
  - H3：Markdown
  - H3：JSONC
  - H3：JSONL
  - H3：YAML
  - H2：子命令参考
  - H3：resolve &lt;oc-path&gt;
  - H3：find &lt;pattern&gt;
  - H3：set &lt;oc-path&gt; &lt;value&gt;
  - H3：validate &lt;oc-path&gt;
  - H3：emit &lt;file&gt;
  - H2：退出代码
  - H2：输出模式
  - H2：说明
  - H2：相关内容

## cli/plugins.md

- 路由：/cli/plugins
- 标题：
  - H2：命令
  - H2：创作
  - H3：提供商脚手架
  - H2：安装
  - H3：市场简写
  - H2：列表
  - H3：插件索引
  - H2：卸载
  - H2：更新
  - H2：检查
  - H2：Doctor
  - H2：注册表
  - H2：市场
  - H2：相关内容

## cli/policy.md

- 路由：/cli/policy
- 标题：
  - H1：openclaw policy
  - H2：快速开始
  - H3：策略规则参考
  - H4：限定范围的覆盖层
  - H4：频道
  - H4：MCP 服务器
  - H4：模型提供商
  - H4：网络
  - H4：入口和渠道访问
  - H4：Gateway 网关
  - H4：Agent 工作区
  - H4：沙箱安全态势
  - H4：数据处理
  - H4：密钥
  - H4：Exec 审批
  - H4：身份验证配置文件
  - H4：工具元数据
  - H4：工具安全态势
  - H2：运行检查
  - H2：配置策略
  - H2：接受策略状态
  - H2：发现的问题
  - H2：修复
  - H2：退出代码
  - H2：相关内容

## cli/promos.md

- 路由：/cli/promos
- 标题：
  - H1：openclaw promos
  - H2：命令
  - H2：openclaw promos list
  - H2：openclaw promos claim &lt;slug&gt;
  - H2：在模型列表中被动发现

## cli/proxy.md

- 路由：/cli/proxy
- 标题：
  - H1：openclaw proxy
  - H2：验证
  - H3：选项
  - H2：调试代理
  - H2：相关内容

## cli/qr.md

- 路由：/cli/qr
- 标题：
  - H1：openclaw qr
  - H2：选项
  - H2：设置代码内容
  - H2：Gateway 网关 URL 解析
  - H2：身份验证解析（无 --remote）
  - H2：身份验证解析（--remote）
  - H2：相关内容

## cli/reset.md

- 路由：/cli/reset
- 标题：
  - H1：openclaw reset
  - H2：选项
  - H2：范围
  - H2：说明
  - H2：相关内容

## cli/sandbox.md

- 路由：/cli/sandbox
- 标题：
  - H2：命令
  - H3：openclaw sandbox list
  - H3：openclaw sandbox recreate
  - H3：openclaw sandbox explain
  - H2：为什么需要重新创建
  - H2：常见触发条件
  - H2：注册表迁移
  - H2：配置
  - H2：相关内容

## cli/secrets.md

- 路由：/cli/secrets
- 标题：
  - H1：openclaw secrets
  - H2：重新加载运行时快照
  - H2：审计
  - H2：配置（交互式助手）
  - H3：Exec 提供商安全性
  - H2：应用已保存的计划
  - H3：为什么没有回滚备份
  - H2：示例
  - H2：相关内容

## cli/security.md

- 路由：/cli/security
- 标题：
  - H1：openclaw security
  - H2：审计模式
  - H2：检查内容
  - H2：SecretRef 行为
  - H2：抑制项
  - H2：JSON 输出
  - H2：--fix 更改的内容
  - H2：相关内容

## cli/sessions.md

- 路由：/cli/sessions
- 标题：
  - H1：openclaw sessions
  - H2：跟踪轨迹进度
  - H2：导出轨迹包
  - H2：清理维护
  - H2：压缩会话
  - H3：sessions.compact RPC
  - H2：相关内容

## cli/setup.md

- 路由：/cli/setup
- 标题：
  - H1：openclaw setup
  - H2：选项
  - H3：基线模式
  - H2：示例
  - H2：说明
  - H2：相关内容

## cli/skills.md

- 路由：/cli/skills
- 标题：
  - H1：openclaw skills
  - H2：命令
  - H2：技能工坊
  - H2：相关内容

## cli/status.md

- 路由：/cli/status
- 标题：
  - H2：会话和模型解析
  - H2：用量和配额
  - H2：概览和更新状态
  - H2：密钥
  - H2：记忆
  - H2：相关内容

## cli/system.md

- 路由：/cli/system
- 标题：
  - H1：openclaw system
  - H2：常用命令
  - H2：system event
  - H2：system heartbeat last|enable|disable
  - H2：system presence
  - H2：说明
  - H2：相关内容

## cli/tasks.md

- 路由：/cli/tasks
- 标题：
  - H2：用法
  - H2：根选项
  - H2：子命令
  - H3：list
  - H3：show
  - H3：notify
  - H3：cancel
  - H3：audit
  - H3：maintenance
  - H3：flow
  - H2：相关内容

## cli/transcripts.md

- 路由：/cli/transcripts
- 标题：
  - H1：openclaw transcripts
  - H2：命令
  - H2：输出
  - H2：每天有多个会话
  - H2：缺失摘要
  - H2：配置

## cli/tui.md

- 路由：/cli/tui
- 标题：
  - H1：openclaw tui
  - H2：选项
  - H2：说明
  - H2：示例
  - H2：配置修复循环
  - H2：相关内容

## cli/uninstall.md

- 路由：/cli/uninstall
- 标题：
  - H1：openclaw uninstall
  - H2：选项
  - H2：示例
  - H2：说明
  - H2：相关内容

## cli/update.md

- 路由：/cli/update
- 标题：
  - H1：openclaw update
  - H2：用法
  - H2：选项
  - H2：update status
  - H2：update repair
  - H2：update wizard
  - H2：执行的操作
  - H3：重启交接
  - H3：控制平面响应结构
  - H2：Git 检出流程
  - H3：渠道选择
  - H3：更新步骤
  - H3：插件同步详情
  - H2：相关内容

## cli/voicecall.md

- 路由：/cli/voicecall
- 标题：
  - H1：openclaw voicecall
  - H2：子命令
  - H2：设置和冒烟测试
  - H3：setup
  - H3：smoke
  - H2：通话生命周期
  - H3：call
  - H3：start
  - H3：continue
  - H3：speak
  - H3：dtmf
  - H3：end
  - H3：status
  - H2：日志和指标
  - H3：tail
  - H3：latency
  - H2：公开 Webhooks
  - H3：expose
  - H2：相关内容

## cli/webhooks.md

- 路由：/cli/webhooks
- 标题：
  - H1：openclaw webhooks
  - H2：子命令
  - H2：webhooks gmail setup
  - H3：必需项
  - H3：Pub/Sub 选项
  - H3：OpenClaw 投递选项
  - H3：gog watch serve 选项
  - H3：Tailscale 暴露
  - H3：输出
  - H2：webhooks gmail run
  - H2：相关内容

## cli/wiki.md

- 路由：/cli/wiki
- 标题：
  - H1：openclaw wiki
  - H2：常用命令
  - H2：智能体选择
  - H2：命令
  - H3：wiki status
  - H3：wiki doctor
  - H3：wiki init
  - H3：wiki ingest &lt;path&gt;
  - H3：wiki okf import &lt;path&gt;
  - H3：wiki compile
  - H3：wiki lint
  - H3：wiki search &lt;query&gt;
  - H3：wiki get &lt;lookup&gt;
  - H3：wiki apply
  - H3：wiki bridge import
  - H3：wiki unsafe-local import
  - H3：wiki chatgpt import
  - H3：wiki chatgpt rollback &lt;run-id&gt;
  - H3：wiki obsidian ...
  - H2：实用使用指南
  - H2：配置关联
  - H2：相关内容

## cli/workboard.md

- 路由：/cli/workboard
- 标题：
  - H2：用法
  - H2：list
  - H2：create
  - H2：show
  - H2：move
  - H2：dispatch
  - H2：斜杠命令一致性
  - H2：权限
  - H2：故障排查
  - H3：未显示任何卡片
  - H3：调度提示仅数据模式
  - H3：调度未启动任何内容
  - H2：相关内容

## cli/worker.md

- 路由：/cli/worker
- 标题：
  - H1：openclaw worker
  - H2：启动契约
  - H2：运行时边界

## concepts/active-memory.md

- 路由：/concepts/active-memory
- 标题：
  - H2：快速开始
  - H2：工作原理
  - H2：运行时机
  - H3：会话类型
  - H2：会话开关
  - H2：如何查看
  - H2：查询模式
  - H2：提示词样式
  - H2：模型回退策略
  - H3：速度建议
  - H4：Cerebras 设置
  - H2：记忆工具
  - H3：内置 memory-core
  - H3：LanceDB 记忆
  - H3：Lossless Claw
  - H2：高级逃生通道
  - H2：对话记录持久化
  - H2：配置
  - H2：推荐设置
  - H3：冷启动宽限期
  - H2：调试
  - H2：常见问题
  - H2：相关页面

## concepts/agent-loop.md

- 路由：/concepts/agent-loop
- 标题：
  - H2：入口点
  - H2：运行顺序
  - H2：排队和并发
  - H2：会话和工作区准备
  - H2：提示词组装
  - H2：Hooks
  - H3：内部钩子（Gateway 网关钩子）
  - H3：插件钩子
  - H2：流式传输
  - H2：工具执行
  - H2：回复整形
  - H2：压缩和重试
  - H2：事件流
  - H2：聊天渠道处理
  - H2：超时
  - H3：卡住的会话诊断
  - H2：可能提前结束的位置
  - H2：相关内容

## concepts/agent-runtimes.md

- 路由：/concepts/agent-runtimes
- 标题：
  - H2：Codex 界面
  - H2：运行时所有权
  - H2：运行时选择
  - H2：GitHub Copilot agent runtime
  - H2：兼容性契约
  - H2：状态标签
  - H2：相关内容

## concepts/agent-workspace.md

- 路由：/concepts/agent-workspace
- 标题：
  - H2：默认位置
  - H2：其他工作区文件夹
  - H2：工作区文件映射
  - H2：工作区中不包含的内容
  - H2：Git 备份（推荐，私有）
  - H2：不要提交机密信息
  - H2：将工作区迁移到新计算机
  - H2：高级说明
  - H2：相关内容

## concepts/agent.md

- 路由：/concepts/agent
- 标题：
  - H2：工作区（必需）
  - H2：引导文件（已注入）
  - H2：内置工具
  - H2：Skills
  - H2：运行时边界
  - H2：会话
  - H2：流式传输期间的 Steering
  - H2：模型引用
  - H2：配置（最小）
  - H2：相关内容

## concepts/architecture.md

- 路由：/concepts/architecture
- 标题：
  - H2：概览
  - H2：组件和流程
  - H3：Gateway 网关（守护进程）
  - H3：客户端（Mac 应用 / CLI / Web 管理后台）
  - H3：节点（macOS / iOS / Android / 无界面）
  - H3：WebChat
  - H2：连接生命周期（单个客户端）
  - H2：线协议（摘要）
  - H2：配对和本地信任
  - H2：协议类型和代码生成
  - H2：远程访问
  - H2：运维快照
  - H2：不变量
  - H2：相关内容

## concepts/channel-docking.md

- 路由：/concepts/channel-docking
- 标题：
  - H2：示例
  - H2：为什么使用它
  - H2：必需配置
  - H2：命令
  - H2：发生变化的内容
  - H2：保持不变的内容
  - H2：故障排查

## concepts/commitments.md

- 路由：/concepts/commitments
- 标题：
  - H2：启用跟进承诺
  - H2：工作原理
  - H2：范围
  - H2：跟进承诺与提醒
  - H2：管理跟进承诺
  - H2：隐私和成本
  - H2：故障排查
  - H2：相关内容

## concepts/compaction.md

- 路由：/concepts/compaction
- 标题：
  - H2：工作原理
  - H2：自动压缩
  - H2：手动压缩
  - H2：配置
  - H3：使用其他模型
  - H3：标识符保留
  - H3：活动对话记录字节数保护
  - H3：后继对话记录
  - H3：压缩通知
  - H3：记忆刷新
  - H2：可插拔压缩提供商
  - H2：压缩与剪枝
  - H2：故障排查
  - H2：相关内容

## concepts/context-engine.md

- 路由：/concepts/context-engine
- 标题：
  - H2：快速开始
  - H2：工作原理
  - H3：子智能体生命周期（可选）
  - H3：系统提示词附加内容
  - H2：旧版引擎
  - H2：插件引擎
  - H3：ContextEngine 接口
  - H3：运行时设置
  - H3：宿主要求
  - H3：故障隔离
  - H3：ownsCompaction
  - H2：配置参考
  - H2：与压缩和记忆的关系
  - H2：提示
  - H2：相关内容

## concepts/context.md

- 路由：/concepts/context
- 标题：
  - H2：快速开始（检查上下文）
  - H2：输出示例
  - H3：/context list
  - H3：/context detail
  - H3：/context map
  - H2：上下文窗口中包含哪些内容
  - H2：OpenClaw 如何构建系统提示词
  - H2：注入的工作区文件（项目上下文）
  - H2：Skills：注入与按需加载
  - H2：工具：存在两类成本
  - H2：命令、指令和“内联快捷方式”
  - H2：会话、压缩和剪枝（会保留什么）
  - H2：/context 实际报告的内容
  - H2：相关内容

## concepts/delegate-architecture.md

- 路由：/concepts/delegate-architecture
- 标题：
  - H2：什么是委派智能体
  - H2：为什么使用委派智能体
  - H2：能力层级
  - H3：层级 1：只读 + 草稿
  - H3：层级 2：代为发送
  - H3：层级 3：主动执行
  - H2：先决条件：隔离和加固
  - H3：硬性禁止项（不可协商）
  - H3：工具限制
  - H3：沙箱隔离
  - H3：审计轨迹
  - H2：设置委派智能体
  - H3：1. 创建委派智能体
  - H3：2. 配置身份提供商委派
  - H4：Microsoft 365
  - H4：Google Workspace
  - H3：3. 将委派智能体绑定到渠道
  - H3：4. 向委派智能体添加凭据
  - H2：示例：组织助理
  - H2：扩展模式
  - H2：相关内容

## concepts/dreaming.md

- 路由：/concepts/dreaming
- 标题：
  - H2：Dreaming 写入的内容
  - H2：阶段模型
  - H2：会话对话记录摄取
  - H2：梦境日记
  - H2：深度排序信号
  - H3：QA 影子试验报告覆盖范围
  - H2：调度
  - H2：快速开始
  - H2：斜杠命令
  - H2：CLI 工作流
  - H2：关键默认值
  - H2：梦境 UI
  - H2：相关内容

## concepts/experimental-features.md

- 路由：/concepts/experimental-features
- 标题：
  - H2：当前已记录的标志
  - H2：本地模型精简模式
  - H3：为什么使用这些工具
  - H3：何时启用
  - H3：何时保持关闭
  - H3：启用
  - H2：实验性并不意味着隐藏
  - H2：相关内容

## concepts/features.md

- 路由：/concepts/features
- 标题：
  - H2：亮点
  - H2：完整列表
  - H2：相关内容

## concepts/managed-worktrees.md

- 路由：/concepts/managed-worktrees
- 标题：
  - H2：布局和命名
  - H2：配置被忽略的文件
  - H2：运行仓库设置
  - H2：会话工作树
  - H2：快照、清理和恢复
  - H2：CLI
  - H2：Gateway 网关方法
  - H2：Workboard 工作空间

## concepts/mantis-slack-desktop-runbook.md

- 路由：/concepts/mantis-slack-desktop-runbook
- 标题：
  - H2：存储模型
  - H2：GitHub 调度
  - H2：本地 CLI
  - H2：注入模式
  - H2：耗时解读
  - H2：证据检查清单
  - H2：故障处理
  - H2：相关内容

## concepts/mantis.md

- 路由：/concepts/mantis
- 标题：
  - H2：所有权
  - H2：CLI 命令
  - H3：discord-smoke
  - H3：run
  - H3：desktop-browser-smoke
  - H3：slack-desktop-smoke
  - H3：telegram-desktop-builder
  - H2：证据清单
  - H2：GitHub 自动化
  - H2：机器和密钥
  - H2：运行结果
  - H2：添加场景
  - H2：待解决问题

## concepts/markdown-formatting.md

- 路由：/concepts/markdown-formatting
- 标题：
  - H2：处理流水线
  - H2：IR 示例
  - H2：表格处理
  - H2：分块规则
  - H2：链接策略
  - H2：剧透内容
  - H2：添加或更新渠道格式化器
  - H2：常见陷阱
  - H2：相关内容

## concepts/memory-builtin.md

- 路由：/concepts/memory-builtin
- 标题：
  - H2：提供的功能
  - H2：入门指南
  - H2：支持的嵌入提供商
  - H2：索引工作原理
  - H2：适用场景
  - H2：故障排查
  - H2：配置
  - H2：相关内容

## concepts/memory-honcho.md

- 路由：/concepts/memory-honcho
- 标题：
  - H2：提供的功能
  - H2：可用工具
  - H2：入门指南
  - H2：配置
  - H2：迁移现有记忆
  - H2：工作原理
  - H2：Honcho 与内置记忆对比
  - H2：CLI 命令
  - H2：延伸阅读
  - H2：相关内容

## concepts/memory-qmd.md

- 路由：/concepts/memory-qmd
- 标题：
  - H2：相较内置记忆增加的功能
  - H2：入门指南
  - H3：前置条件
  - H3：启用
  - H2：辅助进程的工作原理
  - H2：搜索性能和兼容性
  - H2：模型覆盖
  - H2：索引额外路径
  - H2：索引会话记录
  - H2：搜索范围
  - H2：引用
  - H2：适用场景
  - H2：故障排查
  - H2：配置
  - H2：相关内容

## concepts/memory-search.md

- 路由：/concepts/memory-search
- 标题：
  - H2：快速开始
  - H2：支持的提供商
  - H2：搜索工作原理
  - H2：提升搜索质量
  - H3：时间衰减
  - H3：MMR（多样性）
  - H3：同时启用两者
  - H2：多模态记忆
  - H2：会话记忆搜索
  - H2：故障排查
  - H2：相关内容

## concepts/memory.md

- 路由：/concepts/memory
- 标题：
  - H2：工作原理
  - H2：内容存放位置
  - H2：从编程助手导入
  - H2：操作敏感型记忆
  - H2：推断式跟进承诺
  - H2：记忆工具
  - H2：记忆搜索
  - H2：记忆后端
  - H2：知识 wiki 层
  - H2：自动刷新记忆
  - H2：Dreaming
  - H2：基于依据的回填和实时提升
  - H2：CLI
  - H2：延伸阅读

## concepts/message-lifecycle-refactor.md

- 路由：/concepts/message-lifecycle-refactor
- 标题：
  - H2：进行此次重构的原因
  - H2：已发布的内容
  - H3：发送上下文
  - H3：接收上下文
  - H3：实时预览
  - H3：持久回执
  - H3：精简公共 SDK
  - H2：实现与原始设计的差异
  - H2：具体迁移风险（仍然相关）
  - H2：故障分类
  - H2：待解决问题
  - H2：相关内容

## concepts/messages.md

- 路由：/concepts/messages
- 标题：
  - H2：入站去重
  - H2：入站防抖
  - H2：会话和设备
  - H2：提示词正文和历史上下文
  - H2：工具结果元数据
  - H2：排队和后续消息
  - H2：渠道运行所有权
  - H2：流式传输、分块和批处理
  - H2：推理可见性和 token
  - H2：前缀、话题串和回复
  - H2：静默回复
  - H2：相关内容

## concepts/model-failover.md

- 路由：/concepts/model-failover
- 标题：
  - H2：运行时流程
  - H2：选择来源策略
  - H2：身份验证失败跳过缓存
  - H2：用户可见的回退通知
  - H2：身份验证存储（密钥 + OAuth）
  - H2：配置文件 ID
  - H2：轮换顺序
  - H3：会话粘性（缓存友好）
  - H3：OpenAI Codex 订阅和 API 密钥备用方案
  - H2：冷却期
  - H2：因计费问题禁用
  - H2：模型回退
  - H3：候选链规则
  - H3：触发继续回退的错误
  - H3：冷却期跳过与探测行为
  - H2：会话覆盖和实时模型切换
  - H2：可观测性和故障摘要
  - H2：相关配置

## concepts/model-providers.md

- 路由：/concepts/model-providers
- 标题：
  - H2：快速规则
  - H2：在 Control UI 中配置提供商
  - H2：插件所有的提供商行为
  - H2：API 密钥轮换
  - H2：官方提供商插件
  - H3：OpenAI
  - H3：Anthropic
  - H3：OpenAI ChatGPT/Codex OAuth
  - H3：其他订阅式托管选项
  - H3：OpenCode
  - H3：Google Gemini（API 密钥）
  - H3：Google Vertex 和 Gemini CLI
  - H3：Z.AI (GLM)
  - H3：Vercel AI Gateway 网关
  - H3：其他内置提供商插件
  - H4：值得了解的特殊之处
  - H2：通过 models.providers 使用提供商（自定义/基础 URL）
  - H3：Moonshot AI（Kimi）
  - H3：Kimi Coding
  - H3：火山引擎（豆包）
  - H3：BytePlus（国际版）
  - H3：Synthetic
  - H3：MiniMax
  - H3：LM Studio
  - H3：Ollama
  - H3：vLLM
  - H3：SGLang
  - H3：本地代理（LM Studio、vLLM、LiteLLM 等）
  - H2：CLI 示例
  - H2：相关内容

## concepts/models.md

- 路由：/concepts/models
- 标题：
  - H2：选择顺序
  - H2：选择来源和回退严格程度
  - H2：快速模型策略
  - H2：新手引导
  - H2：“不允许使用此模型”（以及回复停止的原因）
  - H2：聊天中的 /model
  - H2：CLI
  - H2：模型注册表（models.json）
  - H2：相关内容

## concepts/multi-agent.md

- 路由：/concepts/multi-agent
- 标题：
  - H2：一个智能体的构成
  - H2：路径
  - H3：单智能体模式（默认）
  - H2：智能体辅助工具
  - H2：快速开始
  - H2：多个智能体，多种角色设定
  - H2：每个智能体独立的 Memory Wiki 仓库
  - H2：跨智能体 QMD 记忆搜索
  - H2：一个 WhatsApp 号码，多名用户（私信拆分）
  - H2：路由规则
  - H2：多个账号/电话号码
  - H2：概念
  - H2：平台示例
  - H2：常见模式
  - H2：按 Agent 配置的沙箱和工具配置
  - H2：相关内容

## concepts/oauth.md

- 路由：/concepts/oauth
- 标题：
  - H2：令牌接收端（存在原因）
  - H2：存储（令牌存放位置）
  - H2：复用 Anthropic Claude CLI
  - H2：OAuth 交换（登录工作原理）
  - H3：Anthropic setup-token
  - H3：OpenAI Codex（ChatGPT OAuth）
  - H2：刷新 + 过期
  - H2：多个账号（配置文件）+ 路由
  - H3：1）推荐：使用独立智能体
  - H3：2）高级：在一个智能体中使用多个配置文件
  - H2：相关内容

## concepts/parallel-specialist-lanes.md

- 路由：/concepts/parallel-specialist-lanes
- 标题：
  - H2：基本原则
  - H2：推荐实施步骤
  - H3：阶段 1：通道契约 + 后台重型工作
  - H3：阶段 2：优先级和并发控制
  - H3：阶段 3：协调器/流量控制器
  - H2：最小通道契约模板
  - H2：相关内容

## concepts/personal-agent-benchmark-pack.md

- 路由：/concepts/personal-agent-benchmark-pack
- 标题：
  - H2：场景
  - H2：隐私模型
  - H2：扩展基准包

## concepts/presence.md

- 路由：/concepts/presence
- 标题：
  - H2：在线状态字段（显示的内容）
  - H2：来源（在线状态来自何处）
  - H3：1) Gateway 网关自身条目
  - H3：2) WebSocket 连接
  - H4：为什么临时控制平面连接不会显示
  - H3：3) system-event 信标
  - H3：4) 节点连接（role: node）
  - H2：合并与去重规则（instanceId 为何重要）
  - H2：TTL 和大小限制
  - H2：远程/隧道注意事项（环回 IP）
  - H2：使用方
  - H3：Control UI 设备页面
  - H3：macOS 实例标签页
  - H2：调试技巧
  - H2：相关内容

## concepts/progress-drafts.md

- 路由：/concepts/progress-drafts
- 标题：
  - H2：快速开始
  - H2：用户看到的内容
  - H2：选择模式
  - H2：配置标签
  - H2：控制进度行
  - H3：详细模式
  - H3：命令/执行文本
  - H3：评论通道
  - H3：状态标题
  - H3：行数限制
  - H3：富文本渲染（Slack）
  - H3：隐藏工具/任务行
  - H2：渠道行为
  - H2：结束处理
  - H2：故障排查
  - H2：相关内容

## concepts/qa-e2e-automation.md

- 路由：/concepts/qa-e2e-automation
- 标题：
  - H2：命令界面
  - H3：基于配置文件的 QA 运行
  - H2：操作员流程
  - H3：可观测性冒烟测试
  - H3：Matrix 冒烟测试通道
  - H3：Discord Mantis 场景
  - H3：Mantis Slack 桌面端和视觉任务运行器
  - H3：凭据池健康检查
  - H2：实时传输覆盖范围
  - H2：Discord、Slack、Telegram 和 WhatsApp QA 参考
  - H3：通用 CLI 标志
  - H3：Telegram QA
  - H3：Discord QA
  - H3：Slack QA
  - H4：设置 Slack 工作区
  - H3：WhatsApp QA
  - H3：Convex 凭据池
  - H2：由仓库提供的种子数据
  - H2：提供商模拟通道
  - H2：传输适配器
  - H3：添加渠道
  - H3：场景辅助函数名称
  - H2：报告
  - H2：相关文档

## concepts/qa-matrix.md

- 路由：/concepts/qa-matrix
- 标题：
  - H2：快速开始
  - H2：该通道执行的操作
  - H2：CLI
  - H3：通用标志
  - H3：提供商标志
  - H2：配置文件
  - H2：场景
  - H2：环境变量
  - H2：输出工件
  - H2：分诊技巧
  - H2：实时传输契约
  - H2：相关内容

## concepts/queue-steering.md

- 路由：/concepts/queue-steering
- 标题：
  - H2：运行时边界
  - H2：模式
  - H2：突发示例
  - H2：范围
  - H2：防抖
  - H2：相关内容

## concepts/queue.md

- 路由：/concepts/queue
- 标题：
  - H2：为什么需要队列
  - H2：工作原理
  - H2：默认值
  - H2：队列模式
  - H2：队列选项
  - H2：Steer 和流式传输
  - H2：优先级
  - H2：按会话覆盖
  - H2：取消排队轮次
  - H2：范围和保证
  - H2：故障排查
  - H2：相关内容

## concepts/retry.md

- 路由：/concepts/retry
- 标题：
  - H2：目标
  - H2：默认值
  - H2：行为
  - H3：模型提供商
  - H3：Discord
  - H3：Telegram
  - H2：配置
  - H2：注意事项
  - H2：相关内容

## concepts/session-pruning.md

- 路由：/concepts/session-pruning
- 标题：
  - H2：为什么这很重要
  - H2：工作原理
  - H2：旧版图像清理
  - H2：智能默认值
  - H2：启用或禁用
  - H2：修剪与压缩
  - H2：延伸阅读
  - H2：相关内容

## concepts/session-search.md

- 路由：/concepts/session-search
- 标题：
  - H1：会话搜索
  - H2：可见性和输出
  - H2：索引生命周期
  - H2：会话搜索与记忆搜索

## concepts/session-state.md

- 路由：/concepts/session-state
- 标题：
  - H2：信号日志
  - H2：监视器
  - H2：通知：只发一次，不重复发送
  - H2：状态协调
  - H2：存储和限制
  - H2：相关内容

## concepts/session-tool.md

- 路由：/concepts/session-tool
- 标题：
  - H2：可用工具
  - H2：列出和读取会话
  - H2：发送跨会话消息
  - H2：状态和编排辅助工具
  - H2：会话状态变更
  - H2：生成子智能体
  - H2：可见性
  - H2：延伸阅读
  - H2：相关内容

## concepts/session.md

- 路由：/concepts/session
- 标题：
  - H2：消息的路由方式
  - H2：私信隔离
  - H3：停靠已关联渠道
  - H2：会话生命周期
  - H2：状态存储位置
  - H2：会话维护
  - H2：检查会话
  - H2：延伸阅读
  - H2：相关内容

## concepts/soul.md

- 路由：/concepts/soul
- 标题：
  - H2：SOUL.md 中应包含哪些内容
  - H2：为什么这种方式有效
  - H2：Molty 提示词
  - H2：优秀内容应有的样子
  - H2：一项警告
  - H2：相关内容

## concepts/streaming.md

- 路由：/concepts/streaming
- 标题：
  - H2：分块流式传输（渠道消息）
  - H3：通过分块流式传输交付媒体
  - H2：分块算法（下限/上限）
  - H2：合并（合并流式块）
  - H2：块之间的拟人化节奏
  - H2：“流式传输分块或全部内容”
  - H2：预览流式传输模式
  - H3：渠道映射
  - H3：旧版键迁移
  - H2：运行时行为
  - H3：Telegram
  - H3：Discord
  - H3：Slack
  - H3：Mattermost
  - H3：Matrix
  - H2：工具进度预览更新
  - H2：进度草稿渲染
  - H3：评论进度通道
  - H2：相关内容

## concepts/system-prompt.md

- 路由：/concepts/system-prompt
- 标题：
  - H2：结构
  - H2：提示词模式
  - H2：提示词快照
  - H2：工作区引导注入
  - H2：时间处理
  - H2：Skills
  - H2：文档
  - H2：相关内容

## concepts/timezone.md

- 路由：/concepts/timezone
- 标题：
  - H2：三个时区界面
  - H2：设置用户时区
  - H2：信封中的时区值
  - H2：何时覆盖
  - H2：相关内容

## concepts/typebox.md

- 路由：/concepts/typebox
- 标题：
  - H2：心智模型（30 秒）
  - H2：架构存放位置
  - H2：当前流水线
  - H2：运行时如何使用架构
  - H2：示例帧
  - H2：最小客户端（Node.js）
  - H2：完整示例：端到端添加方法
  - H2：Swift 代码生成行为
  - H2：版本控制和兼容性
  - H2：架构模式和约定
  - H2：实时架构 JSON
  - H2：更改架构时
  - H2：相关内容

## concepts/typing-indicators.md

- 路由：/concepts/typing-indicators
- 标题：
  - H2：默认值
  - H2：模式
  - H2：配置
  - H2：注意事项
  - H2：相关内容

## concepts/usage-tracking.md

- 路由：/concepts/usage-tracking
- 标题：
  - H2：它是什么
  - H2：显示位置
  - H2：Anthropic 和 OpenAI 成本历史记录
  - H2：默认用量页脚模式
  - H3：三种不同的会话状态
  - H3：优先级
  - H3：重置与关闭
  - H3：切换行为
  - H3：配置
  - H2：自定义 /usage 完整页脚
  - H3：结构
  - H3：契约路径
  - H3：动词
  - H3：片段形式
  - H3：示例
  - H2：提供商和凭据
  - H2：相关内容

## date-time.md

- 路由：/date-time
- 标题：
  - H2：消息信封（默认使用本地时间）
  - H3：示例
  - H2：系统提示词：当前日期和时间
  - H2：系统事件行（默认使用本地时间）
  - H3：配置用户时区和格式
  - H2：时间格式检测（自动）
  - H2：工具载荷和连接器（原始提供商时间及规范化字段）
  - H2：相关文档

## debug/node-issue.md

- 路由：/debug/node-issue
- 标题：
  - H1：Node + tsx“\\name is not a function”崩溃
  - H2：状态
  - H2：原始症状
  - H2：原因
  - H2：当前复现检查
  - H2：解决方法（如果崩溃再次出现）
  - H2：参考资料
  - H2：相关内容

## diagnostics/flags.md

- 路由：/diagnostics/flags
- 标题：
  - H2：工作原理
  - H2：已知标志
  - H2：通过配置启用
  - H2：环境变量覆盖（一次性）
  - H2：性能分析器标志
  - H2：时间线工件
  - H2：日志存放位置
  - H2：提取日志
  - H2：注意事项
  - H2：相关内容

## gateway/1password.md

- 路由：/gateway/1password
- 标题：
  - H2：要求
  - H2：使用 op 解析配置密钥
  - H2：无界面 Gateway 网关的服务账户设置
  - H2：面向智能体的 1password Skill
  - H2：安全注意事项
  - H2：故障排查

## gateway/audit.md

- 路由：/gateway/audit
- 标题：
  - H1：审计历史
  - H2：记录类别
  - H2：消息生命周期事件
  - H3：会话类型分类
  - H2：隐私模型
  - H2：覆盖范围和证明限制
  - H2：存储、保留和迁移
  - H2：查询
  - H2：相关内容

## gateway/authentication.md

- 路由：/gateway/authentication
- 标题：
  - H2：推荐设置：API key（任意提供商）
  - H2：Anthropic：复用 Claude CLI
  - H2：手动输入令牌
  - H3：由 SecretRef 支持的凭据
  - H2：检查模型身份验证状态
  - H2：API key 轮换（Gateway 网关）
  - H2：在 Gateway 网关运行时移除提供商身份验证
  - H2：控制使用哪个凭据
  - H3：OpenAI 和旧版 openai-codex ID
  - H3：登录期间（CLI）
  - H3：按会话（聊天命令）
  - H3：按智能体（CLI 覆盖）
  - H2：故障排除
  - H3：“未找到凭据”
  - H3：令牌即将过期/已过期
  - H2：相关内容

## gateway/background-process.md

- 路由：/gateway/background-process
- 标题：
  - H2：Exec 工具
  - H3：环境变量覆盖
  - H3：配置（优先于环境变量覆盖）
  - H2：子进程桥接
  - H2：process 工具
  - H2：示例
  - H2：相关内容

## gateway/bonjour.md

- 路由：/gateway/bonjour
- 标题：
  - H2：通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）
  - H3：Gateway 配置
  - H3：一次性 DNS 服务器设置（Gateway 网关主机，仅限 macOS）
  - H3：Tailscale DNS 设置
  - H3：Gateway 网关监听器安全
  - H2：广播的内容
  - H2：服务类型
  - H2：TXT 键（非机密提示）
  - H2：在 macOS 上调试
  - H2：在 Gateway 网关日志中调试
  - H2：在 iOS 节点上调试
  - H2：何时启用 Bonjour
  - H2：何时禁用 Bonjour
  - H2：Docker 注意事项
  - H2：排查 Bonjour 被禁用的问题
  - H2：常见故障模式
  - H2：转义的实例名称（\032）
  - H2：启用/禁用/配置
  - H2：相关文档

## gateway/bridge-protocol.md

- 路由：/gateway/bridge-protocol
- 标题：
  - H2：它曾经存在的原因
  - H2：传输协议
  - H2：握手和配对
  - H2：帧
  - H2：Exec 生命周期事件
  - H2：历史 tailnet 用法
  - H2：版本控制
  - H2：相关内容

## gateway/cli-backends.md

- 路由：/gateway/cli-backends
- 标题：
  - H2：快速开始
  - H2：将其用作回退方案
  - H2：配置
  - H2：工作原理
  - H3：Claude CLI 特有说明
  - H2：会话
  - H2：来自 claude-cli 会话的回退前导内容
  - H2：图像
  - H2：输入和输出
  - H2：插件所有的默认值
  - H2：文本转换覆盖
  - H2：原生压缩所有权
  - H2：内置 MCP 覆盖
  - H2：重新植入历史记录上限
  - H2：限制
  - H2：故障排除
  - H2：相关内容

## gateway/cloud-workers.md

- 路由：/gateway/cloud-workers
- 标题：
  - H2：各组件的运行位置
  - H2：要求
  - H2：配置
  - H3：设置命令
  - H3：安装渠道
  - H2：分派会话
  - H2：安全模型
  - H2：故障排除
  - H2：相关内容

## gateway/config-agents.md

- 路由：/gateway/config-agents
- 标题：
  - H2：智能体默认值
  - H3：agents.defaults.workspace
  - H3：agents.defaults.repoRoot
  - H3：agents.defaults.skills
  - H3：agents.defaults.skipBootstrap
  - H3：agents.defaults.skipOptionalBootstrapFiles
  - H3：agents.defaults.contextInjection
  - H3：agents.defaults.bootstrapMaxChars
  - H3：agents.defaults.bootstrapTotalMaxChars
  - H3：按智能体覆盖引导配置文件
  - H3：agents.defaults.bootstrapPromptTruncationWarning
  - H3：上下文预算所有权映射
  - H4：agents.defaults.startupContext
  - H4：agents.defaults.contextLimits
  - H4：agents.list[].contextLimits
  - H4：skills.limits.maxSkillsPromptChars
  - H4：agents.list[].skillsLimits.maxSkillsPromptChars
  - H3：agents.defaults.imageMaxDimensionPx
  - H3：agents.defaults.imageQuality
  - H3：agents.defaults.userTimezone
  - H3：agents.defaults.timeFormat
  - H3：agents.defaults.model
  - H3：运行时策略
  - H3：agents.defaults.cliBackends
  - H3：agents.defaults.promptOverlays
  - H3：agents.defaults.heartbeat
  - H3：agents.defaults.compaction
  - H3：agents.defaults.runRetries
  - H3：agents.defaults.contextPruning
  - H3：分块流式传输
  - H3：输入状态指示器
  - H3：agents.defaults.sandbox
  - H3：agents.list（按智能体覆盖）
  - H2：多智能体路由
  - H3：绑定匹配字段
  - H3：按智能体配置的访问配置文件
  - H2：会话
  - H2：消息
  - H3：响应前缀
  - H3：确认表情回应
  - H3：队列
  - H3：入站防抖
  - H3：其他消息键
  - H3：TTS（文本转语音）
  - H2：Talk
  - H2：相关内容

## gateway/config-channels.md

- 路由：/gateway/config-channels
- 标题：
  - H2：渠道
  - H3：私信和群组访问
  - H3：渠道模型覆盖
  - H3：渠道默认值和 Heartbeat
  - H3：WhatsApp
  - H3：Telegram
  - H3：Discord
  - H3：Google Chat
  - H3：Slack
  - H3：Mattermost
  - H3：Signal
  - H3：iMessage
  - H3：Matrix
  - H3：Microsoft Teams
  - H3：IRC
  - H3：多账户（所有渠道）
  - H3：其他插件渠道
  - H3：群聊提及门控
  - H4：私信历史记录限制
  - H4：与自己聊天模式
  - H3：命令（聊天命令处理）
  - H2：相关内容

## gateway/config-tools.md

- 路由：/gateway/config-tools
- 标题：
  - H2：工具
  - H3：工具配置文件
  - H3：工具组
  - H3：沙箱工具策略中的 MCP 和插件工具
  - H3：tools.codeMode
  - H3：tools.allow / tools.deny
  - H3：tools.byProvider
  - H3：tools.toolsBySender
  - H3：tools.elevated
  - H3：tools.exec
  - H3：tools.loopDetection
  - H3：tools.web
  - H3：tools.media
  - H3：tools.agentToAgent
  - H3：tools.sessions
  - H3：tools.sessionsspawn
  - H3：tools.experimental
  - H3：agents.defaults.subagents
  - H2：自定义提供商和基础 URL
  - H3：提供商字段详情
  - H3：提供商示例
  - H2：相关内容

## gateway/configuration-examples.md

- 路由：/gateway/configuration-examples
- 标题：
  - H2：快速开始
  - H3：绝对最小配置
  - H3：推荐的起始配置
  - H2：扩展示例（主要选项）
  - H3：通过符号链接引用的同级技能仓库
  - H2：常见模式
  - H3：共享技能基线和一项覆盖
  - H3：多平台设置
  - H3：受信任节点网络自动审批
  - H3：安全私信模式（共享收件箱/多用户私信）
  - H3：Anthropic API key + MiniMax 回退
  - H3：工作机器人（受限访问）
  - H3：仅使用本地模型
  - H2：提示
  - H2：相关内容

## gateway/configuration-reference.md

- 路由：/gateway/configuration-reference
- 标题：
  - H2：渠道
  - H2：智能体默认值、多智能体、会话和消息
  - H2：工具和自定义提供商
  - H2：Models
  - H2：MCP
  - H2：Skills
  - H2：插件
  - H3：Codex harness 插件配置
  - H2：跟进承诺
  - H2：浏览器
  - H2：UI
  - H2：Gateway 网关
  - H3：OpenAI 兼容端点
  - H3：多实例隔离
  - H3：gateway.tls
  - H3：gateway.reload
  - H2：云端工作节点环境
  - H3：Crabbox 配置文件
  - H3：静态 SSH 开发配置文件
  - H2：Hooks
  - H3：Gmail 集成
  - H2：Canvas 插件主机
  - H2：设备发现
  - H3：mDNS（Bonjour）
  - H3：广域（DNS-SD）
  - H2：环境
  - H3：env（内联环境变量）
  - H3：环境变量替换
  - H2：机密信息
  - H3：SecretRef
  - H3：支持的凭据范围
  - H3：机密信息提供商配置
  - H2：身份验证存储
  - H3：auth.cooldowns
  - H2：审计
  - H2：日志
  - H2：诊断
  - H2：更新
  - H2：ACP
  - H2：CLI
  - H2：向导
  - H2：身份
  - H2：桥接（旧版，已移除）
  - H2：Cron
  - H3：cron.retry
  - H3：cron.failureAlert
  - H3：cron.failureDestination
  - H2：工作树
  - H2：媒体模型模板变量
  - H2：配置包含（$include）
  - H2：相关内容

## gateway/configuration.md

- 路由：/gateway/configuration
- 标题：
  - H2：最小配置
  - H2：编辑配置
  - H2：严格验证
  - H2：常见任务
  - H2：配置热重载
  - H3：重载模式
  - H3：哪些更改可热应用，哪些需要重启
  - H3：重载规划
  - H2：配置 RPC（程序化更新）
  - H2：环境变量
  - H2：完整参考
  - H2：相关内容

## gateway/diagnostics.md

- 路由：/gateway/diagnostics
- 标题：
  - H2：快速开始
  - H2：聊天命令
  - H2：导出内容
  - H2：隐私模型
  - H2：稳定性记录器
  - H2：实用选项
  - H2：禁用诊断
  - H2：相关内容

## gateway/discovery.md

- 路由：/gateway/discovery
- 标题：
  - H2：术语
  - H2：为何同时提供直连和 SSH
  - H2：设备发现输入
  - H3：1) Bonjour / DNS-SD
  - H4：服务信标详情
  - H3：2) Tailnet（跨网络）
  - H3：3) 手动目标 / SSH 目标
  - H2：传输协议选择（客户端策略）
  - H2：配对与身份验证（直连传输协议）
  - H2：各组件的职责
  - H2：相关内容

## gateway/doctor.md

- 路由：/gateway/doctor
- 标题：
  - H2：快速开始
  - H3：无头和自动化模式
  - H2：只读 lint 模式
  - H2：功能概述
  - H2：Dreams UI 回填和重置
  - H2：详细行为和设计理由
  - H2：相关内容

## gateway/external-apps.md

- 路由：/gateway/external-apps
- 标题：
  - H2：当前可用功能
  - H2：推荐方案
  - H2：协作式主机暂停
  - H2：应用代码与插件代码
  - H2：相关内容

## gateway/gateway-lock.md

- 路由：/gateway/gateway-lock
- 标题：
  - H2：原因
  - H2：三个层级
  - H3：状态锁和配置锁
  - H3：套接字绑定
  - H2：运维说明
  - H2：相关内容

## gateway/health.md

- 路由：/gateway/health
- 标题：
  - H2：快速检查
  - H2：深度诊断
  - H2：健康监控配置
  - H2：运行时间监控
  - H3：监控服务设置示例
  - H2：发生故障时
  - H2：专用的“health”命令
  - H2：相关内容

## gateway/heartbeat.md

- 路由：/gateway/heartbeat
- 标题：
  - H2：快速开始（初学者）
  - H2：默认值
  - H2：Heartbeat 提示词的用途
  - H2：响应契约
  - H2：配置
  - H3：作用域和优先级
  - H3：每个智能体的 Heartbeat
  - H3：活跃时段示例
  - H3：全天候设置
  - H3：多账号示例
  - H3：字段说明
  - H2：投递行为
  - H2：可见性控制
  - H3：各标志的作用
  - H3：按渠道与按账号配置的示例
  - H3：常见模式
  - H2：HEARTBEAT.md（可选）
  - H3：tasks: 块
  - H3：智能体能否更新 HEARTBEAT.md？
  - H2：手动唤醒（按需）
  - H2：推理投递（可选）
  - H2：成本考量
  - H2：Heartbeat 后上下文溢出
  - H2：相关内容

## gateway/index.md

- 路由：/gateway
- 标题：
  - H2：5 分钟本地启动
  - H2：运行时模型
  - H2：OpenAI 兼容端点
  - H3：端口和绑定优先级
  - H3：热重载模式
  - H2：操作员命令集
  - H2：多个 Gateway 网关（同一主机）
  - H2：远程访问
  - H2：监管和服务生命周期
  - H2：开发配置文件快速路径
  - H2：协议快速参考（操作员视角）
  - H2：运维检查
  - H3：存活状态
  - H3：就绪状态
  - H3：缺口恢复
  - H2：常见故障特征
  - H2：安全保证
  - H2：相关内容

## gateway/local-model-services.md

- 路由：/gateway/local-model-services
- 标题：
  - H2：工作原理
  - H2：配置结构
  - H2：字段
  - H2：Inferrs 示例
  - H2：ds4 示例
  - H2：相关内容

## gateway/local-models.md

- 路由：/gateway/local-models
- 标题：
  - H2：最低硬件要求
  - H2：选择后端
  - H2：LM Studio + 大型本地模型（Responses API）
  - H3：混合配置：托管式主模型，本地后备模型
  - H3：区域托管 / 数据路由
  - H2：其他 OpenAI 兼容的本地代理
  - H2：规模更小或限制更严格的后端
  - H2：故障排查
  - H2：相关内容

## gateway/logging.md

- 路由：/gateway/logging
- 标题：
  - H1：日志
  - H2：基于文件的日志记录器
  - H3：详细模式与日志级别
  - H2：控制台捕获
  - H2：脱敏
  - H2：Gateway 网关 WebSocket 日志
  - H3：WS 日志样式
  - H2：控制台格式（子系统日志）
  - H2：相关内容

## gateway/multi-tenant-hosting.md

- 路由：/gateway/multi-tenant-hosting
- 标题：
  - H1：多租户托管
  - H2：每个租户为何都需要一个单元
  - H2：架构
  - H2：信任边界
  - H2：隔离层级
  - H2：快速开始
  - H2：当前范围
  - H2：相关内容

## gateway/multiple-gateways.md

- 路由：/gateway/multiple-gateways
- 标题：
  - H2：救援机器人快速开始
  - H3：--profile rescue onboard 会更改哪些内容
  - H2：通用多 Gateway 网关设置
  - H2：隔离检查清单
  - H2：端口映射（派生）
  - H2：浏览器/CDP 说明（常见陷阱）
  - H2：手动环境变量示例
  - H2：快速检查
  - H2：相关内容

## gateway/network-model.md

- 路由：/gateway/network-model
- 标题：
  - H2：相关内容

## gateway/openai-http-api.md

- 路由：/gateway/openai-http-api
- 标题：
  - H2：启用端点
  - H2：安全边界（重要）
  - H2：身份验证
  - H2：何时使用此端点
  - H2：智能体优先的模型契约
  - H2：会话行为
  - H2：请求限制（配置）
  - H2：聊天工具契约
  - H3：支持的请求字段
  - H3：不支持的变体
  - H3：非流式工具响应结构
  - H3：流式工具响应结构
  - H3：工具后续调用循环
  - H2：流式传输（SSE）
  - H2：Open WebUI 快速设置
  - H2：示例
  - H2：相关内容

## gateway/openresponses-http-api.md

- 路由：/gateway/openresponses-http-api
- 标题：
  - H2：身份验证、安全和路由
  - H2：会话行为
  - H2：请求结构
  - H2：项目（输入）
  - H3：message
  - H3：functioncalloutput（基于轮次的工具）
  - H3：reasoning 和 itemreference
  - H2：工具（客户端函数工具）
  - H2：图像（inputimage）
  - H2：文件（inputfile）
  - H2：文件和图像限制（配置）
  - H2：流式传输（SSE）
  - H2：用量
  - H2：错误
  - H2：示例
  - H2：相关内容

## gateway/openshell.md

- 路由：/gateway/openshell
- 标题：
  - H2：前置条件
  - H2：快速开始
  - H2：工作区模式
  - H3：mirror（默认）
  - H3：remote
  - H3：选择模式
  - H2：配置参考
  - H2：示例
  - H3：最小远程设置
  - H3：配备 GPU 的镜像模式
  - H3：使用自定义 Gateway 网关的每智能体 OpenShell
  - H2：生命周期管理
  - H2：安全强化
  - H2：当前限制
  - H2：工作原理
  - H2：相关内容

## gateway/opentelemetry.md

- 路由：/gateway/opentelemetry
- 标题：
  - H2：快速开始
  - H2：导出的信号
  - H2：配置参考
  - H3：环境变量
  - H2：隐私和内容捕获
  - H2：采样和刷新
  - H2：导出的指标
  - H3：模型用量
  - H3：消息流
  - H3：Talk
  - H3：队列和会话
  - H3：会话存活状态遥测
  - H3：Harness 生命周期
  - H3：工具执行和循环检测
  - H3：Exec
  - H3：诊断内部机制（内存、有效载荷、导出器健康状态）
  - H2：导出的跨度
  - H2：诊断事件目录
  - H2：不使用导出器
  - H2：禁用
  - H2：相关内容

## gateway/operator-scopes.md

- 路由：/gateway/operator-scopes
- 标题：
  - H2：角色
  - H2：权限范围级别
  - H2：方法权限范围只是第一道门槛
  - H2：设备配对审批
  - H2：节点配对审批
  - H2：共享密钥身份验证

## gateway/pairing.md

- 路由：/gateway/pairing
- 标题：
  - H2：能力审批的工作原理
  - H2：CLI 工作流（适合无头环境）
  - H2：API 接口（Gateway 网关协议）
  - H2：节点命令门控（2026.3.31+）
  - H2：节点事件信任边界（2026.3.31+）
  - H2：经 SSH 验证的设备自动审批（默认）
  - H2：自动审批（macOS 应用）
  - H2：受信任 CIDR 设备自动审批
  - H2：静默配对取代清理
  - H2：元数据升级自动审批
  - H2：二维码配对辅助工具
  - H2：本地性和转发标头
  - H2：存储（本地、私有）
  - H2：传输协议行为
  - H2：相关内容

## gateway/prometheus.md

- 路由：/gateway/prometheus
- 标题：
  - H2：快速开始
  - H2：导出的指标
  - H2：标签策略
  - H2：PromQL 用法示例
  - H2：在 Prometheus 与 OpenTelemetry 导出之间选择
  - H2：故障排除
  - H2：相关内容

## gateway/protocol.md

- 路由：/gateway/protocol
- 标题：
  - H2：传输与成帧
  - H2：握手
  - H3：工作节点角色与封闭协议
  - H3：客户端能力
  - H3：节点连接示例
  - H2：角色与权限范围
  - H3：能力/命令/权限（节点）
  - H2：在线状态
  - H3：节点后台存活事件
  - H2：广播事件范围
  - H2：RPC 方法系列
  - H3：常见事件系列
  - H3：节点辅助方法
  - H2：审计账本 RPC
  - H2：任务账本 RPC
  - H2：操作员辅助方法
  - H3：models.list 视图
  - H2：Exec 审批
  - H2：智能体交付回退
  - H2：版本控制
  - H3：客户端常量
  - H2：身份验证
  - H2：设备身份与配对
  - H3：设备身份验证迁移诊断
  - H2：TLS 与固定验证
  - H2：范围
  - H2：相关内容

## gateway/remote-gateway-readme.md

- 路由：/gateway/remote-gateway-readme
- 标题：
  - H1：使用远程 Gateway 网关运行 OpenClaw.app
  - H2：设置
  - H2：工作原理
  - H2：相关内容

## gateway/remote.md

- 路由：/gateway/remote
- 标题：
  - H2：核心思路
  - H2：拓扑选项
  - H2：命令流（在哪里运行什么）
  - H2：SSH 隧道（CLI + 工具）
  - H2：CLI 远程默认值
  - H2：凭据优先级
  - H2：Chat UI 远程访问
  - H2：macOS 应用远程模式
  - H2：安全规则（远程/VPN）
  - H3：macOS：通过 LaunchAgent 建立持久 SSH 隧道
  - H4：步骤 1：添加 SSH 配置
  - H4：步骤 2：复制 SSH 密钥（仅一次）
  - H4：步骤 3：配置 Gateway 网关令牌
  - H4：步骤 4：创建 LaunchAgent
  - H4：步骤 5：加载 LaunchAgent
  - H4：故障排除
  - H2：相关内容

## gateway/restart-recovery.md

- 路由：/gateway/restart-recovery
- 标题：
  - H2：重启后保留的内容
  - H2：优雅重启会先排空任务
  - H2：如何检测中断的工作
  - H2：自动恢复
  - H3：子智能体
  - H3：后台任务
  - H3：智能体请求的重启
  - H2：安全阀与可观测性
  - H2：不会恢复的内容

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- 路由：/gateway/sandbox-vs-tool-policy-vs-elevated
- 标题：
  - H2：快速调试
  - H2：沙箱：工具在哪里运行
  - H3：绑定挂载（快速安全检查）
  - H2：工具策略：哪些工具存在/可调用
  - H3：工具组（简写）
  - H2：提升权限：仅 Exec“在主机上运行”
  - H2：常见“沙箱牢笼”问题的修复方法
  - H3：“工具 X 被沙箱工具策略阻止”
  - H3：“我以为这是主智能体，为什么它处于沙箱隔离状态？”
  - H2：相关内容

## gateway/sandboxing.md

- 路由：/gateway/sandboxing
- 标题：
  - H2：哪些内容会进行沙箱隔离
  - H2：模式、范围和后端
  - H2：Docker 后端
  - H3：沙箱浏览器
  - H2：SSH 后端
  - H2：OpenShell 后端
  - H2：工作区访问
  - H2：自定义绑定挂载
  - H2：镜像与设置
  - H2：setupCommand（一次性容器设置）
  - H2：工具策略与逃生通道
  - H2：多智能体覆盖配置
  - H2：最小启用示例
  - H2：相关内容

## gateway/secrets-plan-contract.md

- 路由：/gateway/secrets-plan-contract
- 标题：
  - H2：计划文件结构
  - H2：提供商更新插入与删除
  - H2：支持的目标范围
  - H2：目标类型行为
  - H2：路径验证规则
  - H2：失败行为
  - H2：Exec 提供商同意行为
  - H2：运行时和审计范围说明
  - H2：操作员检查
  - H2：相关文档

## gateway/secrets.md

- 路由：/gateway/secrets
- 标题：
  - H2：运行时模型
  - H2：出口时注入（哨兵值）
  - H2：智能体访问边界
  - H2：活动表面过滤
  - H2：Gateway 网关身份验证表面诊断
  - H2：新手引导引用预检
  - H2：SecretRef 契约
  - H2：提供商配置
  - H2：基于文件的 API 密钥
  - H2：Exec 集成示例
  - H2：MCP 服务器环境变量
  - H2：沙箱 SSH 身份验证材料
  - H2：支持的凭据表面
  - H2：必需行为与优先级
  - H2：激活触发器
  - H2：降级和恢复信号
  - H2：命令路径解析
  - H2：审计和配置工作流
  - H2：单向安全策略
  - H2：旧版身份验证兼容性说明
  - H2：Web UI 说明
  - H2：相关内容

## gateway/security/audit-checks.md

- 路由：/gateway/security/audit-checks
- 标题：
  - H2：相关内容

## gateway/security/exposure-runbook.md

- 路由：/gateway/security/exposure-runbook
- 标题：
  - H2：选择暴露模式
  - H2：预检清单
  - H2：基线检查
  - H2：最低安全基线
  - H2：私信和群组暴露
  - H2：反向代理检查
  - H2：工具和沙箱审查
  - H2：变更后验证
  - H2：回滚计划
  - H2：审查清单

## gateway/security/index.md

- 路由：/gateway/security
- 标题：
  - H2：范围：个人助理安全模型
  - H2：openclaw 安全审计
  - H3：审计检查内容（概要）
  - H3：分诊发现时的优先级顺序
  - H2：60 秒内完成强化基线配置
  - H2：信任边界矩阵
  - H2：设计上不属于漏洞的行为
  - H2：Gateway 网关与节点信任
  - H2：威胁模型
  - H2：私信访问：配对、允许列表、开放、禁用
  - H3：允许列表（两层）
  - H3：私信会话隔离（多用户模式）
  - H2：上下文可见性与触发授权
  - H2：提示注入
  - H3：外部内容与不受信任输入包装
  - H3：绕过标志（生产环境中保持关闭）
  - H3：群组中的推理和详细输出
  - H2：命令授权
  - H2：控制平面工具
  - H2：节点执行（system.run）
  - H2：动态 Skills（监视器/远程节点）
  - H2：插件
  - H2：沙箱隔离
  - H3：子智能体委派防护措施
  - H3：只读模式
  - H2：按智能体配置的访问配置文件（多智能体）
  - H3：完全访问（无沙箱）
  - H3：只读工具 + 只读工作区
  - H3：无文件系统/shell 访问（允许提供商消息传递）
  - H2：浏览器控制风险
  - H3：浏览器 SSRF 策略（默认严格）
  - H2：网络暴露
  - H3：绑定、端口、防火墙
  - H3：使用 UFW 发布 Docker 端口
  - H3：mDNS/Bonjour 设备发现
  - H3：Gateway 网关 WebSocket 身份验证
  - H3：Tailscale Serve 身份标头
  - H3：反向代理配置
  - H3：HSTS 与来源说明
  - H3：通过 HTTP 使用 Control UI
  - H3：不安全/危险标志
  - H2：部署与主机信任
  - H2：磁盘上的密钥
  - H3：凭据存储映射
  - H3：文件权限
  - H3：工作区 .env 文件
  - H3：日志与转录记录
  - H2：安全基线（复制/粘贴）
  - H3：独立号码（WhatsApp、Signal、Telegram）
  - H2：事件响应
  - H3：遏制
  - H3：轮换（如果密钥泄露，则假定已遭入侵）
  - H3：审计
  - H3：收集报告所需信息
  - H2：密钥扫描
  - H2：报告安全问题

## gateway/security/secure-file-operations.md

- 路由：/gateway/security/secure-file-operations
- 标题：
  - H2：默认：不使用 Python 辅助程序
  - H2：不使用 Python 时仍受保护的内容
  - H2：Python 提供的额外功能
  - H2：插件与核心指南

## gateway/security/shrinkwrap.md

- 路由：/gateway/security/shrinkwrap
- 标题：
  - H2：为何重要
  - H2：生成与检查
  - H2：检查已发布的软件包

## gateway/tailscale.md

- 路由：/gateway/tailscale
- 标题：
  - H2：模式
  - H2：配置示例
  - H3：仅 Tailnet（Serve）
  - H3：仅 Tailnet（绑定到 Tailnet IP）
  - H3：公共互联网（Funnel + 共享密码）
  - H2：CLI 示例
  - H2：身份验证
  - H3：Tailscale 身份标头（仅 Serve）
  - H2：说明
  - H3：Tailscale 前提条件与限制
  - H2：浏览器控制（远程 Gateway 网关 + 本地浏览器）
  - H2：了解更多
  - H2：相关内容

## gateway/tools-invoke-http-api.md

- 路由：/gateway/tools-invoke-http-api
- 标题：
  - H2：身份验证
  - H2：安全边界（重要）
  - H2：请求正文
  - H2：策略 + 路由行为
  - H2：响应
  - H2：示例
  - H2：相关内容

## gateway/troubleshooting.md

- 路由：/gateway/troubleshooting
- 标题：
  - H2：命令排查顺序
  - H2：更新后
  - H2：脑裂式安装和较新配置保护机制
  - H2：回滚后的协议不匹配
  - H2：Skills 符号链接因路径逃逸而被跳过
  - H2：Anthropic 长上下文触发 429，需要额外用量
  - H2：上游 403 阻止响应
  - H2：本地 OpenAI 兼容后端可通过直接探测，但智能体运行失败
  - H2：无回复
  - H2：仪表板 Control UI 连接
  - H3：身份验证详细代码速查表
  - H2：Gateway 网关服务未运行
  - H2：macOS Gateway 网关悄然停止响应，触碰仪表板后又恢复
  - H2：存在重复 Gateway 网关/节点 LaunchAgent 时的 macOS launchd 监管循环
  - H2：Gateway 网关在高内存使用期间退出
  - H2：Gateway 网关拒绝了无效配置
  - H2：Gateway 网关探测警告
  - H2：渠道已连接，但消息未流转
  - H2：Cron 和 Heartbeat 递送
  - H2：节点已配对，但工具失败
  - H2：浏览器工具失败
  - H2：如果升级后某项功能突然出错
  - H2：相关内容

## gateway/trusted-proxy-auth.md

- 路由：/gateway/trusted-proxy-auth
- 标题：
  - H2：适用场景
  - H2：不适用场景
  - H2：工作原理
  - H2：配置
  - H3：配置参考
  - H2：Control UI 配对行为
  - H2：操作员权限范围请求头
  - H2：TLS 终止和 HSTS
  - H3：部署指南
  - H2：代理设置示例
  - H2：混合令牌配置
  - H2：安全检查清单
  - H2：安全审计
  - H2：故障排查
  - H2：从令牌身份验证迁移
  - H2：相关内容

## help/debugging.md

- 路由：/help/debugging
- 标题：
  - H2：运行时调试覆盖项
  - H2：会话跟踪输出
  - H2：插件生命周期跟踪
  - H2：CLI 启动和命令性能分析
  - H2：Gateway 网关监视模式
  - H2：开发配置文件 + 开发 Gateway 网关（--dev）
  - H2：原始流日志记录
  - H2：安全注意事项
  - H2：在 VSCode 中调试
  - H3：设置
  - H3：说明
  - H2：相关内容

## help/environment.md

- 路由：/help/environment
- 标题：
  - H2：优先级（从高到低）
  - H2：提供商凭据和工作区 .env
  - H2：配置中的环境变量块
  - H2：Shell 环境变量导入
  - H2：Exec Shell 快照
  - H2：运行时注入的环境变量
  - H2：UI 环境变量
  - H2：配置中的环境变量替换
  - H2：密钥引用与 ${ENV} 字符串
  - H2：路径相关环境变量
  - H2：日志
  - H3：OPENCLAWHOME
  - H2：nvm 用户：webfetch TLS 失败
  - H2：旧版环境变量
  - H2：相关内容

## help/faq-first-run.md

- 路由：/help/faq-first-run
- 标题：
  - H2：快速开始和首次运行设置
  - H2：相关内容

## help/faq-models.md

- 路由：/help/faq-models
- 标题：
  - H2：模型：默认值、选择、别名和切换
  - H2：模型故障转移和“所有模型均失败”
  - H2：身份验证配置文件：定义及管理方式
  - H2：相关内容

## help/faq.md

- 路由：/help/faq
- 标题：
  - H2：功能异常时的最初六十秒
  - H2：快速开始和首次运行设置
  - H2：OpenClaw 是什么？
  - H2：Skills 和自动化
  - H2：沙箱隔离和记忆
  - H2：各类内容在磁盘上的存储位置
  - H2：配置基础知识
  - H2：远程 Gateway 网关和节点
  - H2：环境变量和 .env 加载
  - H2：会话和多个聊天
  - H2：模型、故障转移和身份验证配置文件
  - H2：Gateway 网关：端口、“已在运行”和远程模式
  - H2：日志和调试
  - H2：媒体和附件
  - H2：安全和访问控制
  - H2：聊天命令、中止任务和“它停不下来”
  - H2：其他
  - H2：相关内容

## help/index.md

- 路由：/help
- 标题：
  - H2：常见问题
  - H2：诊断
  - H2：测试
  - H2：社区和元信息

## help/scripts.md

- 路由：/help/scripts
- 标题：
  - H2：约定
  - H2：身份验证监控脚本
  - H2：GitHub 读取辅助工具
  - H2：添加脚本时
  - H2：相关内容

## help/testing-live.md

- 路由：/help/testing-live
- 标题：
  - H2：实时测试：本地冒烟测试命令
  - H2：实时测试：Android 节点能力全面检查
  - H2：实时测试：模型冒烟测试（配置文件键）
  - H3：第 1 层：直接完成模型请求（无 Gateway 网关）
  - H3：第 2 层：Gateway 网关 + 开发智能体冒烟测试（“@openclaw”的实际行为）
  - H2：实时测试：CLI 后端冒烟测试（Claude、Gemini 或其他本地 CLI）
  - H2：实时测试：APNs HTTP/2 代理可达性
  - H2：实时测试：ACP 绑定冒烟测试（/acp spawn ... --bind here）
  - H2：实时测试：Codex app-server harness 冒烟测试
  - H3：推荐的实时测试方案
  - H2：实时测试：模型矩阵（涵盖范围）
  - H3：聚合器/替代 Gateway 网关
  - H2：凭据（绝不提交）
  - H2：Deepgram 实时测试（音频转录）
  - H2：BytePlus 编程套餐实时测试
  - H2：ComfyUI 工作流媒体实时测试
  - H2：图像生成实时测试
  - H2：音乐生成实时测试
  - H2：视频生成实时测试
  - H2：媒体实时测试框架
  - H2：相关内容

## help/testing-updates-plugins.md

- 路由：/help/testing-updates-plugins
- 标题：
  - H2：保护的内容
  - H2：开发期间的本地验证
  - H2：Docker 测试通道
  - H2：软件包验收
  - H2：发布默认设置
  - H2：旧版兼容性
  - H2：添加覆盖范围
  - H2：故障分类排查

## help/testing.md

- 路由：/help/testing
- 标题：
  - H2：快速开始
  - H2：测试临时目录
  - H2：实时测试和 Docker/Parallels 工作流
  - H2：QA 专用运行器
  - H3：通过 Convex 共享 Telegram 凭据（v1）
  - H3：向 QA 添加渠道
  - H2：测试套件（各自运行位置）
  - H3：单元测试/集成测试（默认）
  - H3：稳定性（Gateway 网关）
  - H3：E2E（仓库汇总）
  - H3：E2E（Gateway 网关冒烟测试）
  - H3：E2E（Control UI 模拟浏览器）
  - H3：E2E：OpenShell 后端冒烟测试
  - H3：实时测试（真实提供商 + 真实模型）
  - H2：应该运行哪个套件？
  - H2：实时测试（访问网络的测试）
  - H2：Docker 运行器（可选的“可在 Linux 中运行”检查）
  - H2：文档完整性检查
  - H2：离线回归测试（CI 安全）
  - H2：智能体可靠性评估（Skills）
  - H2：契约测试（插件和渠道结构）
  - H3：命令
  - H3：渠道契约
  - H3：提供商契约
  - H3：运行时机
  - H2：添加回归测试（指南）
  - H2：相关内容

## help/troubleshooting.md

- 路由：/help/troubleshooting
- 标题：
  - H2：最初的六十秒
  - H2：助手能力受限或缺少工具
  - H2：Anthropic 长上下文 429
  - H2：本地 OpenAI 兼容后端可直接工作，但在 OpenClaw 中失败
  - H2：插件安装因缺少 OpenClaw 扩展而失败
  - H2：安装策略阻止插件安装或更新
  - H2：插件已存在，但因所有权可疑而被阻止
  - H2：决策树
  - H2：相关内容

## index.md

- 路由：/
- 标题：
  - H1：OpenClaw 🦞
  - H2：浏览文档
  - H2：OpenClaw 是什么？
  - H2：工作原理
  - H2：核心能力
  - H2：快速开始
  - H2：仪表板
  - H2：配置（可选）
  - H2：从这里开始
  - H2：了解更多

## install/ansible.md

- 路由：/install/ansible
- 标题：
  - H2：前置条件
  - H2：获得的内容
  - H2：快速开始
  - H2：安装的内容
  - H2：安装后设置
  - H3：常用命令
  - H2：安全架构
  - H2：手动安装
  - H2：更新
  - H2：故障排查
  - H2：高级配置
  - H2：相关内容

## install/azure.md

- 路由：/install/azure
- 标题：
  - H2：将执行的操作
  - H2：所需条件
  - H2：配置部署
  - H2：部署 Azure 资源
  - H2：安装 OpenClaw
  - H2：成本注意事项
  - H2：清理
  - H2：后续步骤
  - H2：相关内容

## install/bun.md

- 路由：/install/bun
- 标题：
  - H2：安装
  - H2：生命周期脚本
  - H2：注意事项
  - H2：相关内容

## install/clawdock.md

- 路由：/install/clawdock
- 标题：
  - H2：安装
  - H2：获得的内容
  - H3：基本操作
  - H3：容器访问
  - H3：Web UI 和配对
  - H3：设置和维护
  - H3：实用工具
  - H2：首次使用流程
  - H2：配置和密钥
  - H2：相关内容

## install/development-channels.md

- 路由：/install/development-channels
- 标题：
  - H2：切换发布渠道
  - H2：一次性指定版本或标签
  - H2：试运行
  - H2：插件和渠道
  - H2：检查当前状态
  - H2：标签最佳实践
  - H2：macOS 应用可用性
  - H2：相关内容

## install/digitalocean.md

- 路由：/install/digitalocean
- 标题：
  - H2：先决条件
  - H2：设置
  - H2：持久化和备份
  - H2：1 GB RAM 使用技巧
  - H2：故障排查
  - H2：后续步骤
  - H2：相关内容

## install/docker-vm-runtime.md

- 路由：/install/docker-vm-runtime
- 标题：
  - H2：将所需二进制文件预置到镜像中
  - H2：构建并启动
  - H2：各类数据的持久化位置
  - H2：更新
  - H2：相关内容

## install/docker.md

- 路由：/install/docker
- 标题：
  - H2：先决条件
  - H2：容器化 Gateway 网关
  - H3：手动流程
  - H3：升级容器镜像
  - H3：环境变量
  - H3：使用所选插件从源代码构建镜像
  - H3：可观测性
  - H3：健康检查
  - H3：局域网与环回地址
  - H3：宿主机上的本地提供商
  - H3：Docker 中的 Claude CLI 后端
  - H3：Bonjour / mDNS
  - H3：存储和持久化
  - H3：Shell 辅助工具（可选）
  - H3：在 VPS 上运行？
  - H2：Agent 沙箱
  - H3：快速启用
  - H2：故障排查
  - H2：相关内容

## install/exe-dev.md

- 路由：/install/exe-dev
- 标题：
  - H2：所需条件
  - H2：新手快速路径
  - H2：使用 Shelley 自动安装
  - H2：手动安装
  - H2：远程渠道设置
  - H2：远程访问
  - H2：更新
  - H2：相关内容

## install/fly.md

- 路由：/install/fly
- 标题：
  - H2：所需条件
  - H2：新手快速路径
  - H2：故障排查
  - H3：“应用未在预期地址上监听”
  - H3：健康检查失败/连接被拒绝
  - H3：内存不足/内存问题
  - H3：Gateway 网关锁问题
  - H3：配置未被读取
  - H3：通过 SSH 写入配置
  - H3：状态未持久化
  - H2：更新
  - H3：更新机器命令
  - H2：私有部署（强化安全）
  - H3：何时使用私有部署
  - H3：设置
  - H3：访问私有部署
  - H3：私有部署中的 Webhooks
  - H3：安全性权衡
  - H2：说明
  - H2：费用
  - H2：后续步骤
  - H2：相关内容

## install/gcp.md

- 路由：/install/gcp
- 标题：
  - H2：所需条件
  - H2：快速路径
  - H2：故障排查
  - H2：服务账号（安全最佳实践）
  - H2：后续步骤
  - H2：相关内容

## install/hetzner.md

- 路由：/install/hetzner
- 标题：
  - H2：所需条件
  - H2：快速路径
  - H2：基础设施即代码（Terraform）
  - H2：后续步骤
  - H2：相关内容

## install/hostinger.md

- 路由：/install/hostinger
- 标题：
  - H2：先决条件
  - H2：选项 A：一键部署 OpenClaw
  - H2：选项 B：在 VPS 上部署 OpenClaw
  - H2：验证设置
  - H2：故障排查
  - H2：后续步骤
  - H2：相关内容

## install/index.md

- 路由：/install
- 标题：
  - H2：系统要求
  - H2：推荐：安装脚本
  - H2：其他安装方式
  - H3：本地前缀安装程序（install-cli.sh）
  - H3：npm、pnpm 或 bun
  - H3：从源代码安装
  - H3：从 GitHub main 检出版本安装
  - H3：容器和软件包管理器
  - H2：验证安装
  - H2：托管和部署
  - H2：更新、迁移或卸载
  - H2：故障排查：找不到 openclaw

## install/installer.md

- 路由：/install/installer
- 标题：
  - H2：快速命令
  - H2：install.sh
  - H3：流程（install.sh）
  - H3：源代码检出检测
  - H3：示例（install.sh）
  - H2：install-cli.sh
  - H3：流程（install-cli.sh）
  - H3：示例（install-cli.sh）
  - H2：install.ps1
  - H3：流程（install.ps1）
  - H3：示例（install.ps1）
  - H2：CI 和自动化
  - H2：故障排查
  - H2：相关内容

## install/kubernetes.md

- 路由：/install/kubernetes
- 标题：
  - H2：为什么不使用 Helm
  - H2：所需条件
  - H2：快速开始
  - H2：使用 Kind 进行本地测试
  - H2：分步操作
  - H3：1）部署
  - H3：2）访问 Gateway 网关
  - H2：部署的内容
  - H2：自定义
  - H3：Agent 指令
  - H3：Gateway 配置
  - H3：添加提供商
  - H3：自定义命名空间
  - H3：自定义镜像
  - H3：在端口转发之外公开访问
  - H2：重新部署
  - H2：拆除
  - H2：架构说明
  - H2：文件结构
  - H2：相关内容

## install/macos-vm.md

- 路由：/install/macos-vm
- 标题：
  - H2：推荐默认方案（适合大多数用户）
  - H2：macOS 虚拟机选项
  - H3：Apple 芯片 Mac 上的本地虚拟机（Lume）
  - H3：托管式 Mac 提供商（云端）
  - H2：快速路径（Lume，适合有经验的用户）
  - H2：所需条件（Lume）
  - H2：1）安装 Lume
  - H2：2）创建 macOS 虚拟机
  - H2：3）完成设置助理
  - H2：4）获取虚拟机 IP 地址
  - H2：5）通过 SSH 连接虚拟机
  - H2：6）安装 OpenClaw
  - H2：7）配置渠道
  - H2：8）以无界面模式运行虚拟机
  - H2：额外功能：iMessage 集成
  - H2：保存黄金镜像
  - H2：全天候运行
  - H2：故障排查
  - H2：相关文档

## install/migrating-claude.md

- 路由：/install/migrating-claude
- 标题：
  - H2：两种导入方式
  - H2：导入的内容
  - H2：仅保留在归档中的内容
  - H2：源选择
  - H2：推荐流程
  - H2：冲突处理
  - H2：用于自动化的 JSON 输出
  - H2：故障排查
  - H2：相关内容

## install/migrating-hermes.md

- 路由：/install/migrating-hermes
- 标题：
  - H2：两种导入方式
  - H2：导入的内容
  - H2：仅保留在归档中的内容
  - H2：推荐流程
  - H2：冲突处理
  - H2：密钥
  - H2：用于自动化的 JSON 输出
  - H2：故障排查
  - H2：相关内容

## install/migrating.md

- 路由：/install/migrating
- 标题：
  - H2：从其他智能体系统导入
  - H2：将 OpenClaw 迁移到新机器
  - H3：迁移步骤
  - H3：常见问题
  - H3：验证清单
  - H2：原地升级插件
  - H2：相关内容

## install/nix.md

- 路由：/install/nix
- 标题：
  - H2：获得的内容
  - H2：快速开始
  - H2：Nix 模式的运行时行为
  - H3：Nix 模式下的变化
  - H3：配置和状态路径
  - H3：服务 PATH 发现
  - H2：相关内容

## install/node.md

- 路由：/install/node
- 标题：
  - H2：检查版本
  - H2：安装 Node
  - H2：故障排查
  - H3：openclaw：找不到命令
  - H3：npm install -g 权限错误（Linux）
  - H2：相关内容

## install/northflank.mdx

- 路由：/install/northflank
- 标题：
  - H2：如何开始
  - H2：获得的内容
  - H2：连接渠道
  - H2：后续步骤

## install/oracle.md

- 路由：/install/oracle
- 标题：
  - H2：先决条件
  - H2：设置
  - H2：验证安全态势
  - H2：ARM 说明
  - H2：持久化和备份
  - H2：备用方案：SSH 隧道
  - H2：故障排查
  - H2：后续步骤
  - H2：相关内容

## install/podman.md

- 路由：/install/podman
- 标题：
  - H2：先决条件
  - H2：快速开始
  - H2：Podman 和 Tailscale
  - H2：Systemd（Quadlet，可选）
  - H2：配置、环境变量和存储
  - H2：升级镜像
  - H2：实用命令
  - H2：故障排查
  - H2：相关内容

## install/railway.mdx

- 路由：/install/railway
- 标题：
  - H2：一键部署
  - H2：获得的内容
  - H2：连接渠道
  - H2：备份和迁移
  - H2：后续步骤

## install/raspberry-pi.md

- 路由：/install/raspberry-pi
- 标题：
  - H2：硬件兼容性
  - H2：先决条件
  - H2：设置
  - H2：性能技巧
  - H2：推荐的模型设置
  - H2：ARM 二进制文件说明
  - H2：持久化和备份
  - H2：故障排查
  - H2：后续步骤
  - H2：相关内容

## install/render.mdx

- 路由：/install/render
- 标题：
  - H2：先决条件
  - H2：部署
  - H2：蓝图
  - H2：选择套餐
  - H2：部署后
  - H3：访问 Control UI
  - H3：日志
  - H3：Shell 访问
  - H3：环境变量
  - H3：自动部署
  - H2：自定义域名
  - H2：扩缩容
  - H2：备份和迁移
  - H2：故障排查
  - H3：服务无法启动
  - H3：冷启动缓慢（免费套餐）
  - H3：重新部署后数据丢失
  - H3：健康检查失败
  - H2：后续步骤

## install/uninstall.md

- 路由：/install/uninstall
- 标题：
  - H2：简便方式（CLI 仍已安装）
  - H2：手动移除服务（CLI 未安装）
  - H3：macOS（launchd）
  - H3：Linux（systemd 用户单元）
  - H3：Windows（计划任务）
  - H2：常规安装与源代码检出
  - H3：常规安装（install.sh / npm / pnpm / bun）
  - H3：源代码检出（git clone）
  - H2：相关内容

## install/updating.md

- 路由：/install/updating
- 标题：
  - H2：推荐：openclaw update
  - H2：在 npm 和 git 安装之间切换
  - H2：替代方式：重新运行安装程序
  - H2：替代方式：手动使用 npm、pnpm 或 bun
  - H3：npm 安装的高级主题
  - H2：自动更新程序
  - H2：更新后
  - H3：运行 Doctor
  - H3：重启 Gateway 网关
  - H3：验证
  - H2：回滚
  - H3：固定版本（npm）
  - H3：固定提交（源代码）
  - H2：如果遇到问题
  - H2：相关内容

## install/upstash.md

- 路由：/install/upstash
- 标题：
  - H2：前置条件
  - H2：创建 Box
  - H2：通过 SSH 隧道连接
  - H2：安装 OpenClaw
  - H2：运行新手引导
  - H2：启动 Gateway 网关
  - H2：自动重启
  - H2：故障排查
  - H2：相关内容

## logging.md

- 路由：/logging
- 标题：
  - H2：日志存储位置
  - H2：如何读取日志
  - H3：CLI：实时跟踪（推荐）
  - H3：Control UI（Web）
  - H3：仅渠道日志
  - H2：日志格式
  - H3：文件日志（JSONL）
  - H3：控制台输出
  - H3：Gateway 网关 WebSocket 日志
  - H2：配置日志
  - H3：日志级别
  - H3：定向模型传输诊断
  - H3：跟踪关联
  - H3：模型调用大小和耗时
  - H3：控制台样式
  - H3：脱敏
  - H2：诊断和 OpenTelemetry
  - H2：故障排查提示
  - H2：相关内容

## maturity/scorecard.md

- 路由：/maturity/scorecard
- 标题：
  - H1：成熟度评分卡
  - H2：本页面的用途
  - H2：概览
  - H2：评分区间
  - H2：功能面浏览器
  - H2：QA 证据摘要
  - H3：各领域就绪情况

## maturity/taxonomy.md

- 路由：/maturity/taxonomy
- 标题：
  - H1：成熟度分类法
  - H2：如何阅读本页面
  - H2：成熟度级别
  - H2：产品领域
  - H2：详细信息
  - H3：核心
  - H3：平台
  - H3：渠道
  - H3：提供商和工具

## network.md

- 路由：/network
- 标题：
  - H2：核心模型
  - H2：配对 + 身份
  - H2：设备发现 + 传输协议
  - H2：节点 + 传输协议
  - H2：安全性
  - H2：相关内容

## nodes/audio.md

- 路由：/nodes/audio
- 标题：
  - H2：功能
  - H2：自动检测（默认）
  - H2：配置示例
  - H3：提供商 + CLI 回退（OpenAI + Whisper CLI）
  - H3：仅提供商并受权限范围限制
  - H3：仅提供商（Deepgram）
  - H3：仅提供商（Mistral Voxtral）
  - H3：仅提供商（SenseAudio）
  - H3：将转录内容回显到聊天（选择启用）
  - H2：说明和限制
  - H3：常驻本地 STT
  - H3：代理环境支持
  - H2：群组中的提及检测
  - H2：注意事项
  - H2：相关内容

## nodes/camera.md

- 路由：/nodes/camera
- 标题：
  - H2：iOS 节点
  - H3：iOS 用户设置
  - H3：iOS 命令（通过 Gateway 网关 node.invoke）
  - H3：iOS 前台运行要求
  - H3：CLI 辅助工具
  - H2：Android 节点
  - H3：Android 用户设置
  - H3：权限
  - H3：Android 前台运行要求
  - H3：Android 命令（通过 Gateway 网关 node.invoke）
  - H2：macOS 应用
  - H3：macOS 用户设置
  - H3：CLI 辅助工具（节点调用）
  - H2：Linux 节点主机
  - H2：安全性 + 实际限制
  - H2：macOS 屏幕视频（操作系统级）
  - H2：相关内容

## nodes/computer-use.md

- 路由：/nodes/computer-use
- 标题：
  - H2：要求
  - H2：计算机智能体工具
  - H2：computer.act 节点命令
  - H2：启用和解除锁定
  - H2：安全性
  - H2：与其他桌面控制路径的关系

## nodes/images.md

- 路由：/nodes/images
- 标题：
  - H2：目标
  - H2：CLI 界面
  - H2：WhatsApp Web 渠道行为
  - H2：自动回复管道
  - H2：将入站媒体传递给命令
  - H2：限制和错误
  - H2：测试说明
  - H2：相关内容

## nodes/index.md

- 路由：/nodes
- 标题：
  - H2：配对 + 状态
  - H2：版本偏差和升级顺序
  - H2：远程节点主机（system.run）
  - H3：启动节点主机（前台）
  - H3：通过 SSH 隧道访问远程 Gateway 网关（回环绑定）
  - H3：启动节点主机（服务）
  - H3：配对 + 命名
  - H3：节点托管的 MCP 服务器
  - H3：节点托管的 Skills
  - H3：无头身份状态
  - H3：将命令加入允许列表
  - H3：将 Exec 指向节点
  - H3：本地模型推理
  - H3：Codex 会话和转录记录
  - H3：Claude 会话和转录记录
  - H3：OpenCode 和 Pi 会话
  - H2：调用命令
  - H2：命令策略
  - H2：配置（openclaw.json）
  - H2：屏幕截图（画布快照）
  - H3：画布控件
  - H3：A2UI（画布）
  - H2：照片 + 视频（节点摄像头）
  - H2：屏幕录制（节点）
  - H2：位置（节点）
  - H2：SMS（Android 节点）
  - H2：设备和个人数据命令
  - H2：系统命令（节点主机 / Mac 节点）
  - H2：Exec 节点绑定
  - H2：权限映射
  - H2：无头节点主机（跨平台）
  - H2：Mac 节点模式

## nodes/location-command.md

- 路由：/nodes/location-command
- 标题：
  - H2：简而言之
  - H2：为何使用选择器（而不只是开关）
  - H2：设置模型
  - H2：权限映射（node.permissions）
  - H2：命令：location.get
  - H2：后台行为
  - H2：Linux 节点主机
  - H2：模型/工具集成
  - H2：用户体验文案（建议）
  - H2：相关内容

## nodes/media-understanding.md

- 路由：/nodes/media-understanding
- 标题：
  - H2：工作原理
  - H2：配置
  - H3：模型条目
  - H3：提供商凭据
  - H2：规则和行为
  - H3：自动检测（默认）
  - H3：代理支持（音频/视频提供商调用）
  - H2：能力
  - H2：提供商支持矩阵
  - H2：模型选择指南
  - H2：附件策略
  - H3：文件附件提取
  - H2：配置示例
  - H2：状态输出
  - H2：说明
  - H2：相关内容

## nodes/presence.md

- 路由：/nodes/presence
- 标题：
  - H2：要求
  - H2：检查当前活动的计算机
  - H2：活动如何转化为在线状态
  - H2：隐私和模型上下文
  - H2：连接警报如何路由
  - H2：故障排查
  - H2：相关内容

## nodes/talk.md

- 路由：/nodes/talk
- 标题：
  - H2：行为（macOS）
  - H2：回复中的语音指令
  - H2：配置（/.openclaw/openclaw.json）
  - H2：macOS UI
  - H2：Android UI
  - H2：说明
  - H2：相关内容

## nodes/troubleshooting.md

- 路由：/nodes/troubleshooting
- 标题：
  - H2：命令排查阶梯
  - H2：前台运行要求
  - H2：权限矩阵
  - H2：配对与审批
  - H2：常见节点错误代码
  - H2：快速恢复循环
  - H2：相关内容

## nodes/voicewake.md

- 路由：/nodes/voicewake
- 标题：
  - H2：存储
  - H2：协议
  - H3：触发词列表
  - H3：路由（从触发词到目标）
  - H3：事件
  - H2：客户端行为
  - H2：相关内容

## openclaw-agent-runtime.md

- 路由：/openclaw-agent-runtime
- 标题：
  - H2：类型检查和代码检查
  - H2：运行 Agent Runtimes 测试
  - H2：手动测试
  - H2：全新重置
  - H2：参考资料
  - H2：相关内容

## perplexity.md

- 路由：/perplexity
- 标题：
  - H2：相关内容

## plan/cloud-workers.md

- 路由：/plan/cloud-workers
- 标题：
  - H2：状态
  - H2：问题
  - H2：目标
  - H2：非目标（v1）
  - H2：现有方案（借鉴什么，反转什么）
  - H2：架构决策：循环在工作节点上运行，通过 Gateway 网关进行推理
  - H2：组件
  - H3：1. 环境状态机 + 提供商契约
  - H3：2. 工作节点引导：在设备上安装 OpenClaw
  - H3：3. 传输：所有内容均通过 SSH
  - H3：4. 工作节点协议（专用；不是节点协议）
  - H3：5. 会话后端 RPC
  - H3：6. 工作区同步
  - H3：7. 放置状态机、会话和 UI
  - H2：分派和移交
  - H2：安全模型
  - H2：容量
  - H2：生命周期
  - H2：配置界面
  - H2：里程碑
  - H2：待解决问题

## plan/path3-sqlite-session-artifact-family.md

- 路由：/plan/path3-sqlite-session-artifact-family
- 标题：
  - H1：Path 3 SQLite 会话工件族
  - H2：权威工件族
  - H2：切换后的非族工件
  - H2：补丁点
  - H2：聚焦测试

## plan/ui-channels.md

- 路由：/plan/ui-channels
- 标题：
  - H2：状态
  - H2：问题
  - H2：目标
  - H2：非目标
  - H2：目标模型
  - H2：投递元数据
  - H2：运行时能力契约
  - H2：渠道映射
  - H2：重构步骤
  - H2：测试
  - H2：待定问题
  - H2：相关内容

## platforms/android.md

- 路由：/platforms/android
- 标题：
  - H2：支持情况概览
  - H2：在 Google Play 之外安装
  - H2：从远程 Mac 镜像并控制 Android
  - H3：开始之前
  - H3：通过 TCP 启用 ADB
  - H3：仅允许控制端 Mac
  - H3：连接并开始镜像
  - H3：故障排查
  - H2：连接运行手册
  - H3：前提条件
  - H3：1. 启动 Gateway 网关
  - H3：2. 验证设备发现（可选）
  - H4：通过单播 DNS-SD 进行跨网络设备发现
  - H3：3. 从 Android 连接
  - H3：多个 Gateway 网关
  - H3：在线状态信标
  - H3：4. 批准配对（CLI）
  - H3：5. 验证节点已连接
  - H3：6. 聊天和历史记录
  - H3：7. Canvas 和相机
  - H4：Gateway 网关 Canvas 主机（推荐用于 Web 内容）
  - H3：8. 语音和扩展的 Android 命令界面
  - H3：9. 工作区文件（只读）
  - H2：审查命令审批
  - H2：助手入口点
  - H2：通知转发
  - H2：相关内容

## platforms/digitalocean.md

- 路由：/platforms/digitalocean
- 标题：
  - H2：相关内容

## platforms/easyrunner.md

- 路由：/platforms/easyrunner
- 标题：
  - H2：开始之前
  - H2：Compose 应用
  - H2：配置 OpenClaw
  - H2：验证
  - H2：更新和备份
  - H2：故障排查

## platforms/index.md

- 路由：/platforms
- 标题：
  - H2：选择操作系统
  - H2：VPS 和托管
  - H2：常用链接
  - H2：安装 Gateway 网关服务（CLI）
  - H2：相关内容

## platforms/ios-healthkit.md

- 路由：/platforms/ios-healthkit
- 标题：
  - H1：HealthKit 摘要
  - H2：要求
  - H2：启用访问权限
  - H3：1. 授权 Gateway 网关命令
  - H3：2. 在 iPhone 上启用共享
  - H2：请求今日摘要
  - H2：隐私行为
  - H2：故障排查
  - H3：节点未声明该命令
  - H3：命令需要显式选择启用
  - H3：HEALTHACCESSDISABLED
  - H3：摘要成功，但缺少指标
  - H3：较早的时间范围失败
  - H2：相关内容

## platforms/ios.md

- 路由：/platforms/ios
- 标题：
  - H2：功能
  - H2：要求
  - H2：快速开始（配对并连接）
  - H2：健康摘要
  - H2：审查命令审批
  - H2：可选的 Apple Watch 直连节点
  - H2：官方构建版本中由中继支持的推送
  - H2：后台在线状态信标
  - H2：身份验证和信任流程
  - H2：设备发现路径
  - H3：Bonjour（局域网）
  - H3：Tailnet（跨网络）
  - H3：手动指定主机/端口
  - H2：多个 Gateway 网关
  - H2：Canvas + A2UI
  - H2：与计算机使用的关系
  - H3：Canvas 求值/快照
  - H2：语音唤醒和 Talk 模式
  - H2：常见错误
  - H2：相关文档

## platforms/linux.md

- 路由：/platforms/linux
- 标题：
  - H2：桌面配套应用
  - H2：CLI 和 SSH 替代方案
  - H2：节点能力
  - H2：安装
  - H2：Gateway 网关服务（systemd）
  - H2：内存压力和 OOM 终止
  - H2：相关内容

## platforms/mac/bundled-gateway.md

- 路由：/platforms/mac/bundled-gateway
- 标题：
  - H2：自动设置
  - H2：手动恢复
  - H2：Launchd（将 Gateway 网关作为 LaunchAgent）
  - H2：版本兼容性
  - H2：macOS 上的状态目录
  - H2：调试应用连接
  - H2：冒烟检查
  - H2：相关内容

## platforms/mac/canvas.md

- 路由：/platforms/mac/canvas
- 标题：
  - H2：Canvas 所在位置
  - H2：面板行为
  - H2：智能体 API 界面
  - H2：Canvas 中的 A2UI
  - H3：A2UI 命令（v0.8）
  - H2：从 Canvas 触发智能体运行
  - H2：安全说明
  - H2：相关内容

## platforms/mac/child-process.md

- 路由：/platforms/mac/child-process
- 标题：
  - H2：默认行为（launchd）
  - H2：未签名的开发构建
  - H2：仅附加模式
  - H2：远程模式
  - H2：为何首选 launchd
  - H2：相关内容

## platforms/mac/dev-setup.md

- 路由：/platforms/mac/dev-setup
- 标题：
  - H1：macOS 开发环境设置
  - H2：前提条件
  - H2：1. 安装依赖项
  - H2：2. 构建并打包应用
  - H2：3. 安装 CLI 和 Gateway 网关
  - H2：故障排查
  - H3：构建失败：工具链或 SDK 不匹配
  - H3：授予权限时应用崩溃
  - H3：Gateway 网关无限期显示“Starting...”
  - H2：相关内容

## platforms/mac/health.md

- 路由：/platforms/mac/health
- 标题：
  - H1：macOS 上的健康检查
  - H2：菜单栏
  - H2：设置
  - H2：探测的工作原理
  - H2：如有疑问
  - H2：相关内容

## platforms/mac/icon.md

- 路由：/platforms/mac/icon
- 标题：
  - H1：菜单栏图标状态
  - H2：状态
  - H2：语音唤醒耳标
  - H2：形状和尺寸
  - H2：行为说明
  - H2：相关内容

## platforms/mac/logging.md

- 路由：/platforms/mac/logging
- 标题：
  - H1：日志（macOS）
  - H2：滚动诊断文件日志（Debug 窗格）
  - H2：macOS 上统一日志记录中的私有数据
  - H2：为 OpenClaw（ai.openclaw）启用
  - H2：调试后禁用
  - H2：相关内容

## platforms/mac/menu-bar.md

- 路由：/platforms/mac/menu-bar
- 标题：
  - H2：显示内容
  - H2：状态模型
  - H2：IconState 枚举（Swift）
  - H3：ActivityKind -&gt; 徽标符号
  - H3：视觉映射
  - H2：上下文子菜单
  - H2：状态行文本（菜单）
  - H2：事件摄取
  - H2：调试覆盖
  - H2：测试检查清单
  - H2：相关内容

## platforms/mac/peekaboo.md

- 路由：/platforms/mac/peekaboo
- 标题：
  - H2：这是什么（以及不是什么）
  - H2：与其他桌面控制路径的关系
  - H2：启用桥接
  - H2：客户端设备发现顺序
  - H2：安全和权限
  - H2：快照行为（自动化）
  - H2：故障排查
  - H2：相关内容

## platforms/mac/permissions.md

- 路由：/platforms/mac/permissions
- 标题：
  - H2：稳定权限的要求
  - H2：Node 和 CLI 运行时的辅助功能授权
  - H2：提示消失时的恢复检查清单
  - H2：文件和文件夹权限（Desktop/Documents/Downloads）
  - H2：相关内容

## platforms/mac/remote.md

- 路由：/platforms/mac/remote
- 标题：
  - H2：模式
  - H2：远程传输协议
  - H2：远程主机上的前提条件
  - H2：macOS 应用设置
  - H2：Web 聊天
  - H2：权限
  - H2：安全说明
  - H2：WhatsApp 登录流程（远程）
  - H2：故障排查
  - H2：通知声音
  - H2：相关内容

## platforms/mac/signing.md

- 路由：/platforms/mac/signing
- 标题：
  - H1：Mac 签名（调试构建）
  - H2：用法
  - H3：临时签名说明
  - H2：“关于”页面的构建元数据
  - H2：相关内容

## platforms/mac/skills.md

- 路由：/platforms/mac/skills
- 标题：
  - H2：数据源
  - H2：安装操作
  - H2：环境变量/API 密钥
  - H2：远程模式
  - H2：相关内容

## platforms/mac/voice-overlay.md

- 路由：/platforms/mac/voice-overlay
- 标题：
  - H1：语音浮层生命周期（macOS）
  - H2：行为
  - H2：实现
  - H2：日志
  - H2：调试检查清单
  - H2：相关内容

## platforms/mac/voicewake.md

- 路由：/platforms/mac/voicewake
- 标题：
  - H1：语音唤醒和按键说话
  - H2：要求
  - H2：模式
  - H2：运行时行为（唤醒词）
  - H2：生命周期不变量
  - H2：按键说话的具体行为
  - H2：面向用户的设置
  - H2：转发行为
  - H2：转发载荷
  - H2：快速验证
  - H2：相关内容

## platforms/mac/webchat.md

- 路由：/platforms/mac/webchat
- 标题：
  - H2：启动和调试
  - H2：连接方式
  - H2：安全界面
  - H2：已知限制
  - H2：相关内容

## platforms/mac/xpc.md

- 路由：/platforms/mac/xpc
- 标题：
  - H1：OpenClaw macOS IPC 架构
  - H2：目标
  - H2：工作原理
  - H3：Gateway 网关 + 节点传输
  - H3：节点服务 + 应用 IPC
  - H3：PeekabooBridge（UI 自动化）
  - H2：操作流程
  - H2：加固说明
  - H2：相关内容

## platforms/macos.md

- 路由：/platforms/macos
- 标题：
  - H2：下载
  - H2：首次运行
  - H2：更新
  - H2：打开仪表板链接
  - H2：导入浏览器登录信息
  - H2：选择 Gateway 网关模式
  - H2：应用负责的功能
  - H2：macOS 详情页面
  - H2：相关内容

## platforms/oracle.md

- 路由：/platforms/oracle
- 标题：
  - H2：相关内容

## platforms/raspberry-pi.md

- 路由：/platforms/raspberry-pi
- 标题：
  - H2：相关内容

## platforms/windows.md

- 路由：/platforms/windows
- 标题：
  - H2：推荐：Windows Hub
  - H3：Windows Hub 包含的功能
  - H3：首次启动
  - H2：Windows 节点模式
  - H2：本地 MCP 模式
  - H2：原生 Windows CLI 和 Gateway 网关
  - H2：WSL2 Gateway 网关
  - H2：在登录 Windows 前自动启动 Gateway 网关
  - H2：通过局域网公开 WSL 服务
  - H2：故障排查
  - H3：托盘图标未出现
  - H3：本地设置失败
  - H3：应用提示需要配对
  - H3：网页聊天无法连接远程 Gateway 网关
  - H3：screen.snapshot、摄像头或音频命令失败
  - H3：Git 或 GitHub 连接失败
  - H2：相关内容

## plugins/adding-capabilities.md

- 路由：/plugins/adding-capabilities
- 标题：
  - H2：何时创建能力
  - H2：标准流程
  - H2：各部分的归属位置
  - H2：提供商和 harness 接缝
  - H2：文件检查清单
  - H2：完整示例：图像生成
  - H2：嵌入提供商
  - H2：审查清单
  - H2：相关内容

## plugins/admin-http-rpc.md

- 路由：/plugins/admin-http-rpc
- 标题：
  - H2：启用前须知
  - H2：启用
  - H2：验证路由
  - H2：身份验证
  - H2：安全模型
  - H2：请求
  - H2：响应
  - H2：允许的方法
  - H2：与 WebSocket 对比
  - H2：故障排查
  - H2：相关内容

## plugins/agent-tools.md

- 路由：/plugins/agent-tools
- 标题：
  - H2：相关内容

## plugins/architecture-internals.md

- 路由：/plugins/architecture-internals
- 标题：
  - H2：加载管线
  - H3：清单优先行为
  - H3：插件缓存边界
  - H2：注册表模型
  - H2：对话绑定回调
  - H2：提供商运行时钩子
  - H3：钩子顺序和用法
  - H3：提供商示例
  - H3：内置示例
  - H2：运行时辅助功能
  - H3：api.runtime.imageGeneration
  - H2：Gateway 网关 HTTP 路由
  - H2：插件 SDK 导入路径
  - H2：消息工具架构
  - H2：渠道目标解析
  - H2：由配置支持的目录
  - H2：提供商目录
  - H2：只读渠道检查
  - H2：软件包合集
  - H3：渠道目录元数据
  - H2：上下文引擎插件
  - H2：添加新能力
  - H3：能力检查清单
  - H3：能力模板
  - H2：相关内容

## plugins/architecture.md

- 路由：/plugins/architecture
- 标题：
  - H2：公共能力模型
  - H3：外部兼容性立场
  - H3：插件形态
  - H3：旧版钩子
  - H3：兼容性信号
  - H2：架构概览
  - H3：插件元数据快照和查找表
  - H3：激活规划
  - H3：渠道插件和共享消息工具
  - H2：能力所有权模型
  - H3：能力分层
  - H3：多能力公司插件示例
  - H3：能力示例：视频理解
  - H2：契约和强制执行
  - H3：契约应包含的内容
  - H2：执行模型
  - H2：导出边界
  - H2：内部机制和参考
  - H2：相关内容

## plugins/building-extensions.md

- 路由：/plugins/building-extensions
- 标题：
  - H2：相关内容

## plugins/building-plugins.md

- 路由：/plugins/building-plugins
- 标题：
  - H2：要求
  - H2：选择插件形态
  - H2：快速开始
  - H2：注册工具
  - H2：导入约定
  - H2：提交前检查清单
  - H2：针对 Beta 版本进行测试
  - H2：后续步骤
  - H2：相关内容

## plugins/bundles.md

- 路由：/plugins/bundles
- 标题：
  - H2：软件包合集存在的原因
  - H2：安装软件包合集
  - H2：OpenClaw 从软件包合集映射的内容
  - H3：当前支持
  - H4：Skill 内容
  - H4：钩子包
  - H4：用于嵌入式 OpenClaw 的 MCP
  - H4：嵌入式 OpenClaw 设置
  - H4：嵌入式 OpenClaw LSP
  - H3：可检测但不执行
  - H2：软件包合集格式
  - H2：检测优先级
  - H2：运行时依赖和清理
  - H2：安全
  - H2：故障排查
  - H2：相关内容

## plugins/cli-backend-plugins.md

- 路由：/plugins/cli-backend-plugins
- 标题：
  - H2：插件负责的功能
  - H2：最小后端插件
  - H2：配置结构
  - H2：高级后端钩子
  - H3：ownsNativeCompaction：选择不使用 OpenClaw 压缩
  - H2：MCP 工具桥接
  - H2：用户配置
  - H2：验证
  - H2：检查清单
  - H2：相关内容

## plugins/codex-computer-use.md

- 路由：/plugins/codex-computer-use
- 标题：
  - H2：OpenClaw.app 和 Peekaboo
  - H2：iOS 应用
  - H2：直接使用 cua-driver MCP
  - H2：快速设置
  - H2：命令
  - H2：市场选择
  - H2：内置 macOS 市场
  - H3：共享插件缓存
  - H2：远程目录限制
  - H2：配置参考
  - H2：OpenClaw 检查的内容
  - H2：macOS 权限
  - H2：故障排查
  - H2：相关内容

## plugins/codex-harness-reference.md

- 路由：/plugins/codex-harness-reference
- 标题：
  - H2：插件配置界面
  - H2：监管
  - H2：应用服务器传输
  - H2：审批和沙箱模式
  - H2：沙箱隔离的原生执行
  - H2：身份验证和环境隔离
  - H2：动态工具
  - H2：超时
  - H2：模型发现
  - H2：工作区引导文件
  - H2：环境覆盖
  - H2：相关内容

## plugins/codex-harness-runtime.md

- 路由：/plugins/codex-harness-runtime
- 标题：
  - H2：概览
  - H2：线程绑定和模型变更
  - H2：监管和安全继续执行
  - H2：可见回复和 Heartbeat
  - H2：钩子边界
  - H2：V1 支持契约
  - H2：原生权限和 MCP 信息请求
  - H2：队列引导
  - H2：Codex 反馈上传
  - H2：压缩和转录记录镜像
  - H2：媒体和交付
  - H2：相关内容

## plugins/codex-harness.md

- 路由：/plugins/codex-harness
- 标题：
  - H2：要求
  - H2：快速开始
  - H2：与 Codex Desktop 和 CLI 共享线程
  - H2：监管 Codex 会话
  - H2：配置
  - H3：压缩
  - H2：验证 Codex 运行时
  - H2：路由和模型选择
  - H2：部署模式
  - H3：基本 Codex 部署
  - H3：混合提供商部署
  - H3：故障时关闭的 Codex 部署
  - H2：应用服务器策略
  - H2：命令和诊断
  - H3：在本地检查 Codex 线程
  - H3：身份验证顺序
  - H3：环境隔离
  - H3：动态工具和 Web 搜索
  - H3：配置字段
  - H3：动态工具调用超时
  - H3：本地测试环境覆盖
  - H2：Native Codex plugins
  - H2：计算机使用
  - H2：运行时边界
  - H2：故障排查
  - H2：相关内容

## plugins/codex-native-plugins.md

- 路由：/plugins/codex-native-plugins
- 标题：
  - H2：要求
  - H2：快速开始
  - H2：通过聊天管理插件
  - H2：原生插件设置的工作原理
  - H2：V1 支持边界
  - H2：应用清单和所有权
  - H2：已连接账户应用
  - H2：线程应用配置
  - H2：破坏性操作策略
  - H2：故障排查
  - H2：相关内容

## plugins/codex-supervision.md

- 路由：/plugins/codex-supervision
- 标题：
  - H2：开始前须知
  - H2：启用监管
  - H2：使用操作员 CLI
  - H2：从本地会话创建分支
  - H2：归档本地会话
  - H2：了解已配对节点的限制
  - H2：元数据和权限
  - H3：兼容性工具
  - H2：故障排查
  - H2：相关内容

## plugins/community.md

- 路由：/plugins/community
- 标题：
  - H2：查找插件
  - H2：发布插件
  - H2：相关内容

## plugins/compatibility.md

- 路由：/plugins/compatibility
- 标题：
  - H2：兼容性注册表
  - H2：弃用策略
  - H2：当前兼容性领域
  - H3：WhatsApp 入站回调扁平别名
  - H3：WhatsApp 入站准入字段
  - H2：插件检查器软件包
  - H3：维护者验收通道
  - H2：发布说明

## plugins/copilot.md

- 路由：/plugins/copilot
- 标题：
  - H2：要求
  - H2：安装
  - H2：快速开始
  - H2：支持的提供商
  - H2：自带密钥（BYOK）
  - H2：身份验证
  - H2：配置界面
  - H2：压缩
  - H2：对话记录镜像
  - H2：附带问题（/btw）
  - H2：Doctor
  - H2：限制
  - H2：权限和 askuser
  - H3：会话级 GitHub 令牌
  - H2：相关内容

## plugins/dependency-resolution.md

- 路由：/plugins/dependency-resolution
- 标题：
  - H2：职责划分
  - H2：安装根目录
  - H2：本地插件
  - H2：启动和重新加载
  - H2：内置插件
  - H2：旧版内容清理

## plugins/google-meet.md

- 路由：/plugins/google-meet
- 标题：
  - H2：快速开始
  - H3：创建会议
  - H3：仅观察模式加入
  - H3：实时会话健康状态
  - H2：本地 Gateway 网关 + Parallels Chrome
  - H3：常见故障检查
  - H2：安装说明
  - H2：传输协议
  - H3：Chrome
  - H3：Twilio
  - H2：OAuth 和预检
  - H3：创建 Google 凭据
  - H3：生成刷新令牌
  - H3：使用 Doctor 验证 OAuth
  - H3：解析、预检和读取工件
  - H3：实时冒烟测试
  - H3：创建示例
  - H2：配置
  - H3：默认值
  - H3：可选覆盖项
  - H2：工具
  - H2：智能体和双向模式
  - H2：实时测试检查清单
  - H2：故障排查
  - H3：智能体无法看到 Google Meet 工具
  - H3：没有已连接且支持 Google Meet 的节点
  - H3：浏览器已打开，但智能体无法加入
  - H3：会议创建失败
  - H3：智能体已加入但不发言
  - H3：Twilio 设置检查失败
  - H3：Twilio 呼叫已开始，但始终未进入会议
  - H2：说明
  - H2：相关内容

## plugins/hooks.md

- 路由：/plugins/hooks
- 标题：
  - H2：快速开始
  - H2：钩子目录
  - H3：渠道配对请求
  - H2：调试运行时钩子
  - H2：工具调用策略
  - H3：Exec 环境钩子
  - H3：工具结果持久化
  - H2：提示词和模型钩子
  - H3：会话扩展和下一轮注入
  - H2：消息钩子
  - H2：安装钩子
  - H2：Gateway 网关生命周期
  - H3：安全的外部 cron 投影
  - H2：即将弃用的功能
  - H2：相关内容

## plugins/install-overrides.md

- 路由：/plugins/install-overrides
- 标题：
  - H2：环境
  - H2：行为
  - H2：软件包端到端测试

## plugins/llama-cpp.md

- 路由：/plugins/llama-cpp
- 标题：
  - H2：配置
  - H2：原生运行时
  - H2：运行时诊断
  - H2：故障排查

## plugins/logbook.md

- 路由：/plugins/logbook
- 标题：
  - H2：开始之前
  - H2：快速开始
  - H2：工作原理
  - H2：模型和数据流
  - H2：配置
  - H3：视觉模型选择
  - H2：仪表板标签页
  - H2：Gateway 网关方法
  - H2：隐私说明
  - H2：故障排查
  - H3：Logbook 标签页缺失
  - H3：捕获操作报告错误
  - H3：捕获成功但未显示卡片
  - H2：相关内容

## plugins/manage-plugins.md

- 路由：/plugins/manage-plugins
- 标题：
  - H2：使用 Control UI
  - H2：列出和搜索插件
  - H2：启用和禁用插件
  - H2：安装插件
  - H2：重启和检查
  - H2：更新插件
  - H2：卸载插件
  - H2：选择来源
  - H2：发布插件
  - H2：相关内容

## plugins/manifest.md

- 路由：/plugins/manifest
- 标题：
  - H2：此文件的作用
  - H2：最小示例
  - H2：完整示例
  - H2：顶层字段参考
  - H2：catalog 参考
  - H2：生成提供商元数据参考
  - H2：工具元数据参考
  - H2：providerAuthChoices 参考
  - H2：commandAliases 参考
  - H2：activation 参考
  - H2：qaRunners 参考
  - H2：setup 参考
  - H3：setup.providers 参考
  - H3：setup 字段
  - H2：uiHints 参考
  - H2：contracts 参考
  - H2：configContracts 参考
  - H2：mediaUnderstandingProviderMetadata 参考
  - H2：channelConfigs 参考
  - H3：替换其他渠道插件
  - H2：modelSupport 参考
  - H2：modelCatalog 参考
  - H2：modelIdNormalization 参考
  - H2：providerEndpoints 参考
  - H2：providerRequest 参考
  - H2：secretProviderIntegrations 参考
  - H2：modelPricing 参考
  - H3：OpenClaw 提供商索引
  - H2：清单与 package.json
  - H3：影响设备发现的 package.json 字段
  - H2：设备发现优先级（插件 ID 重复）
  - H2：JSON Schema 要求
  - H2：验证行为
  - H2：说明
  - H2：相关内容

## plugins/memory-lancedb.md

- 路由：/plugins/memory-lancedb
- 标题：
  - H2：安装
  - H2：快速开始
  - H2：嵌入配置
  - H3：维度
  - H2：Ollama 嵌入
  - H2：召回和捕获限制
  - H2：命令
  - H2：存储
  - H2：运行时依赖项和平台支持
  - H2：故障排查
  - H3：输入长度超过上下文长度
  - H3：不支持的嵌入模型
  - H3：插件已加载但未显示任何记忆
  - H2：相关内容

## plugins/memory-wiki.md

- 路由：/plugins/memory-wiki
- 标题：
  - H2：知识库模式
  - H2：知识库布局
  - H2：Open Knowledge Format 导入
  - H2：结构化声明和证据
  - H2：面向智能体的实体元数据
  - H2：编译流水线
  - H2：仪表板和健康报告
  - H2：搜索和检索
  - H2：智能体工具
  - H2：提示词和上下文行为
  - H2：配置
  - H3：按智能体配置的知识库
  - H3：示例：QMD + 桥接模式
  - H2：CLI
  - H2：Obsidian 支持
  - H2：推荐工作流
  - H2：相关文档

## plugins/message-presentation.md

- 路由：/plugins/message-presentation
- 标题：
  - H2：契约
  - H2：生产者示例
  - H2：渲染器契约
  - H2：核心渲染流程
  - H2：降级规则
  - H3：按钮值回退的可见性
  - H2：提供商映射
  - H2：呈现与 InteractiveReply
  - H2：投递固定
  - H2：插件作者检查清单
  - H2：相关文档

## plugins/oc-path.md

- 路由：/plugins/oc-path
- 标题：
  - H2：为何启用
  - H2：运行位置
  - H2：启用
  - H2：依赖项
  - H2：提供的功能
  - H2：与其他插件的关系
  - H2：安全性
  - H2：相关内容

## plugins/onepassword.md

- 路由：/plugins/onepassword
- 标题：
  - H1：1Password 密钥代理
  - H2：安全模型
  - H2：开始之前
  - H2：配置已注册的密钥
  - H2：使用智能体工具
  - H2：策略层级和审批
  - H2：检查状态和审计历史记录
  - H2：1Password CLI 行为

## plugins/plugin-inventory.md

- 路由：/plugins/plugin-inventory
- 标题：
  - H1：插件清单
  - H2：定义
  - H2：安装插件
  - H2：核心 npm 软件包
  - H2：官方外部软件包
  - H2：仅限源码检出

## plugins/plugin-permission-requests.md

- 路由：/plugins/plugin-permission-requests
- 标题：
  - H2：选择正确的门控
  - H2：在工具调用前请求审批
  - H2：决策行为
  - H2：路由审批提示
  - H2：Codex 原生权限
  - H2：故障排查
  - H2：相关内容

## plugins/reference.md

- 路由：/plugins/reference
- 标题：
  - H1：插件参考

## plugins/reference/acpx.md

- 路由：/plugins/reference/acpx
- 标题：
  - H1：ACPx 插件
  - H2：分发
  - H2：功能界面
  - H2：Pi 原生会话
  - H2：相关文档

## plugins/reference/admin-http-rpc.md

- 路由：/plugins/reference/admin-http-rpc
- 标题：
  - H1：Admin Http Rpc 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/alibaba.md

- 路由：/plugins/reference/alibaba
- 标题：
  - H1：Alibaba 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/amazon-bedrock-mantle.md

- 路由：/plugins/reference/amazon-bedrock-mantle
- 标题：
  - H1：Amazon Bedrock Mantle 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/amazon-bedrock.md

- 路由：/plugins/reference/amazon-bedrock
- 标题：
  - H1：Amazon Bedrock 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/anthropic-vertex.md

- 路由：/plugins/reference/anthropic-vertex
- 标题：
  - H1：Anthropic Vertex 插件
  - H2：分发
  - H2：功能界面
  - H2：Claude Fable 5
  - H2：Claude Sonnet 5

## plugins/reference/anthropic.md

- 路由：/plugins/reference/anthropic
- 标题：
  - H1：Anthropic 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/arcee.md

- 路由：/plugins/reference/arcee
- 标题：
  - H1：Arcee 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/azure-speech.md

- 路由：/plugins/reference/azure-speech
- 标题：
  - H1：Azure Speech 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/bonjour.md

- 路由：/plugins/reference/bonjour
- 标题：
  - H1：Bonjour 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/brave.md

- 路由：/plugins/reference/brave
- 标题：
  - H1：Brave 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/browser.md

- 路由：/plugins/reference/browser
- 标题：
  - H1：浏览器插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/byteplus.md

- 路由：/plugins/reference/byteplus
- 标题：
  - H1：BytePlus 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/canvas.md

- 路由：/plugins/reference/canvas
- 标题：
  - H1：Canvas 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/cerebras.md

- 路由：/plugins/reference/cerebras
- 标题：
  - H1：Cerebras 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/chutes.md

- 路由：/plugins/reference/chutes
- 标题：
  - H1：Chutes 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/clawrouter.md

- 路由：/plugins/reference/clawrouter
- 标题：
  - H1：ClawRouter 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/clickclack.md

- 路由：/plugins/reference/clickclack
- 标题：
  - H1：Clickclack 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/cloudflare-ai-gateway.md

- 路由：/plugins/reference/cloudflare-ai-gateway
- 标题：
  - H1：Cloudflare AI Gateway 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/codex.md

- 路由：/plugins/reference/codex
- 标题：
  - H1：Codex 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/cohere.md

- 路由：/plugins/reference/cohere
- 标题：
  - H1：Cohere 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/comfy.md

- 路由：/plugins/reference/comfy
- 标题：
  - H1：ComfyUI 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/copilot-proxy.md

- 路由：/plugins/reference/copilot-proxy
- 标题：
  - H1：Copilot Proxy 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/copilot.md

- 路由：/plugins/reference/copilot
- 标题：
  - H1：Copilot 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/crabbox.md

- 路由：/plugins/reference/crabbox
- 标题：
  - H1：Crabbox 插件
  - H2：分发
  - H2：功能界面
  - H2：配置

## plugins/reference/deepgram.md

- 路由：/plugins/reference/deepgram
- 标题：
  - H1：Deepgram 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/deepinfra.md

- 路由：/plugins/reference/deepinfra
- 标题：
  - H1：DeepInfra 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/deepseek.md

- 路由：/plugins/reference/deepseek
- 标题：
  - H1：DeepSeek 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/diagnostics-otel.md

- 路由：/plugins/reference/diagnostics-otel
- 标题：
  - H1：诊断 OpenTelemetry 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/diagnostics-prometheus.md

- 路由：/plugins/reference/diagnostics-prometheus
- 标题：
  - H1：诊断 Prometheus 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/diffs-language-pack.md

- 路由：/plugins/reference/diffs-language-pack
- 标题：
  - H1：Diffs 语言包插件
  - H2：分发
  - H2：功能界面
  - H2：新增语言

## plugins/reference/diffs.md

- 路由：/plugins/reference/diffs
- 标题：
  - H1：Diffs 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/discord.md

- 路由：/plugins/reference/discord
- 标题：
  - H1：Discord 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/document-extract.md

- 路由：/plugins/reference/document-extract
- 标题：
  - H1：文档提取插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/duckduckgo.md

- 路由：/plugins/reference/duckduckgo
- 标题：
  - H1：DuckDuckGo 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/elevenlabs.md

- 路由：/plugins/reference/elevenlabs
- 标题：
  - H1：Elevenlabs 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/exa.md

- 路由：/plugins/reference/exa
- 标题：
  - H1：Exa 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/fal.md

- 路由：/plugins/reference/fal
- 标题：
  - H1：fal 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/featherless.md

- 路由：/plugins/reference/featherless
- 标题：
  - H1：Featherless 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/feishu.md

- 路由：/plugins/reference/feishu
- 标题：
  - H1：Feishu 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/file-transfer.md

- 路由：/plugins/reference/file-transfer
- 标题：
  - H1：文件传输插件
  - H2：分发
  - H2：功能界面

## plugins/reference/firecrawl.md

- 路由：/plugins/reference/firecrawl
- 标题：
  - H1：Firecrawl 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/fireworks.md

- 路由：/plugins/reference/fireworks
- 标题：
  - H1：Fireworks 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/github-copilot.md

- 路由：/plugins/reference/github-copilot
- 标题：
  - H1：GitHub Copilot 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/gmi.md

- 路由：/plugins/reference/gmi
- 标题：
  - H1：Gmi 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/google-meet.md

- 路由：/plugins/reference/google-meet
- 标题：
  - H1：Google Meet 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/google.md

- 路由：/plugins/reference/google
- 标题：
  - H1：Google 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/googlechat.md

- 路由：/plugins/reference/googlechat
- 标题：
  - H1：Google Chat 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/gradium.md

- 路由：/plugins/reference/gradium
- 标题：
  - H1：Gradium 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/groq.md

- 路由：/plugins/reference/groq
- 标题：
  - H1：Groq 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/huggingface.md

- 路由：/plugins/reference/huggingface
- 标题：
  - H1：Hugging Face 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/imessage.md

- 路由：/plugins/reference/imessage
- 标题：
  - H1：iMessage 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/inworld.md

- 路由：/plugins/reference/inworld
- 标题：
  - H1：Inworld 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/irc.md

- 路由：/plugins/reference/irc
- 标题：
  - H1：IRC 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/kilocode.md

- 路由：/plugins/reference/kilocode
- 标题：
  - H1：Kilocode 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/kimi.md

- 路由：/plugins/reference/kimi
- 标题：
  - H1：Kimi 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/line.md

- 路由：/plugins/reference/line
- 标题：
  - H1：LINE 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/linux-node.md

- 路由：/plugins/reference/linux-node
- 标题：
  - H1：Linux 节点插件
  - H2：分发
  - H2：功能界面

## plugins/reference/litellm.md

- 路由：/plugins/reference/litellm
- 标题：
  - H1：LiteLLM 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/llama-cpp.md

- 路由：/plugins/reference/llama-cpp
- 标题：
  - H1：Llama Cpp 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/llm-task.md

- 路由：/plugins/reference/llm-task
- 标题：
  - H1：LLM 任务插件
  - H2：分发
  - H2：功能界面

## plugins/reference/lmstudio.md

- 路由：/plugins/reference/lmstudio
- 标题：
  - H1：LM Studio 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/lobster.md

- 路由：/plugins/reference/lobster
- 标题：
  - H1：Lobster 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/logbook.md

- 路由：/plugins/reference/logbook
- 标题：
  - H1：Logbook 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/longcat.md

- 路由：/plugins/reference/longcat
- 标题：
  - H1：LongCat 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/matrix.md

- 路由：/plugins/reference/matrix
- 标题：
  - H1：Matrix 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/mattermost.md

- 路由：/plugins/reference/mattermost
- 标题：
  - H1：Mattermost 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/memory-core.md

- 路由：/plugins/reference/memory-core
- 标题：
  - H1：Memory Core 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/memory-lancedb.md

- 路由：/plugins/reference/memory-lancedb
- 标题：
  - H1：Memory LanceDB 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/memory-wiki.md

- 路由：/plugins/reference/memory-wiki
- 标题：
  - H1：Memory Wiki 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/meta.md

- 路由：/plugins/reference/meta
- 标题：
  - H1：Meta 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/microsoft-foundry.md

- 路由：/plugins/reference/microsoft-foundry
- 标题：
  - H1：Microsoft Foundry 插件
  - H2：分发
  - H2：功能界面
  - H2：要求
  - H2：聊天模型
  - H2：MAI 图像生成
  - H2：故障排查

## plugins/reference/microsoft.md

- 路由：/plugins/reference/microsoft
- 标题：
  - H1：Microsoft 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/migrate-claude.md

- 路由：/plugins/reference/migrate-claude
- 标题：
  - H1：迁移 Claude 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/migrate-hermes.md

- 路由：/plugins/reference/migrate-hermes
- 标题：
  - H1：迁移 Hermes 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/minimax.md

- 路由：/plugins/reference/minimax
- 标题：
  - H1：MiniMax 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/mistral.md

- 路由：/plugins/reference/mistral
- 标题：
  - H1：Mistral 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/moonshot.md

- 路由：/plugins/reference/moonshot
- 标题：
  - H1：Moonshot 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/msteams.md

- 路由：/plugins/reference/msteams
- 标题：
  - H1：Microsoft Teams 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/mxc.md

- 路由：/plugins/reference/mxc
- 标题：
  - H1：MXC 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/nextcloud-talk.md

- 路由：/plugins/reference/nextcloud-talk
- 标题：
  - H1：Nextcloud Talk 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/nostr.md

- 路由：/plugins/reference/nostr
- 标题：
  - H1：Nostr 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/novita.md

- 路由：/plugins/reference/novita
- 标题：
  - H1：Novita 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/nvidia.md

- 路由：/plugins/reference/nvidia
- 标题：
  - H1：NVIDIA 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/oc-path.md

- 路由：/plugins/reference/oc-path
- 标题：
  - H1：OC Path 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/ollama.md

- 路由：/plugins/reference/ollama
- 标题：
  - H1：Ollama 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/onepassword.md

- 路由：/plugins/reference/onepassword
- 标题：
  - H1：Onepassword 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/open-prose.md

- 路由：/plugins/reference/open-prose
- 标题：
  - H1：Open Prose 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/openai.md

- 路由：/plugins/reference/openai
- 标题：
  - H1：OpenAI 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/opencode-go.md

- 路由：/plugins/reference/opencode-go
- 标题：
  - H1：OpenCode Go 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/opencode.md

- 路由：/plugins/reference/opencode
- 标题：
  - H1：OpenCode 插件
  - H2：分发
  - H2：功能界面
  - H2：原生会话
  - H2：相关文档

## plugins/reference/openrouter.md

- 路由：/plugins/reference/openrouter
- 标题：
  - H1：OpenRouter 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/openshell.md

- 路由：/plugins/reference/openshell
- 标题：
  - H1：Openshell 插件
  - H2：分发
  - H2：功能界面

## plugins/reference/perplexity.md

- 路由：/plugins/reference/perplexity
- 标题：
  - H1：Perplexity 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/pixverse.md

- 路由：/plugins/reference/pixverse
- 标题：
  - H1：PixVerse 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/policy.md

- 路由：/plugins/reference/policy
- 标题：
  - H1：策略插件
  - H2：分发
  - H2：功能界面
  - H2：行为
  - H2：相关文档

## plugins/reference/qa-channel.md

- 路由：/plugins/reference/qa-channel
- 标题：
  - H1：QA channel 插件
  - H2：分发
  - H2：功能界面
  - H2：相关文档

## plugins/reference/qa-lab.md

- 路由：/plugins/reference/qa-lab
- 标题：
  - H1：QA Lab 插件
  - H2：分发
  - H2：接口

## plugins/reference/qa-matrix.md

- 路由：/plugins/reference/qa-matrix
- 标题：
  - H1：QA Matrix 插件
  - H2：分发
  - H2：接口

## plugins/reference/qianfan.md

- 路由：/plugins/reference/qianfan
- 标题：
  - H1：千帆插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/qqbot.md

- 路由：/plugins/reference/qqbot
- 标题：
  - H1：QQ Bot 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/qwen.md

- 路由：/plugins/reference/qwen
- 标题：
  - H1：Qwen 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/raft.md

- 路由：/plugins/reference/raft
- 标题：
  - H1：Raft 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/reef.md

- 路由：/plugins/reference/reef
- 标题：
  - H1：Reef 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/runway.md

- 路由：/plugins/reference/runway
- 标题：
  - H1：Runway 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/searxng.md

- 路由：/plugins/reference/searxng
- 标题：
  - H1：SearXNG 插件
  - H2：分发
  - H2：接口

## plugins/reference/senseaudio.md

- 路由：/plugins/reference/senseaudio
- 标题：
  - H1：Senseaudio 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/sglang.md

- 路由：/plugins/reference/sglang
- 标题：
  - H1：SGLang 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/signal.md

- 路由：/plugins/reference/signal
- 标题：
  - H1：Signal 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/slack.md

- 路由：/plugins/reference/slack
- 标题：
  - H1：Slack 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/sms.md

- 路由：/plugins/reference/sms
- 标题：
  - H1：SMS 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/stepfun.md

- 路由：/plugins/reference/stepfun
- 标题：
  - H1：阶跃星辰插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/synology-chat.md

- 路由：/plugins/reference/synology-chat
- 标题：
  - H1：Synology Chat 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/synthetic.md

- 路由：/plugins/reference/synthetic
- 标题：
  - H1：Synthetic 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/tavily.md

- 路由：/plugins/reference/tavily
- 标题：
  - H1：Tavily 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/telegram.md

- 路由：/plugins/reference/telegram
- 标题：
  - H1：Telegram 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/tencent.md

- 路由：/plugins/reference/tencent
- 标题：
  - H1：腾讯插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/tlon.md

- 路由：/plugins/reference/tlon
- 标题：
  - H1：Tlon 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/together.md

- 路由：/plugins/reference/together
- 标题：
  - H1：Together 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/tokenjuice.md

- 路由：/plugins/reference/tokenjuice
- 标题：
  - H1：Tokenjuice 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/tts-local-cli.md

- 路由：/plugins/reference/tts-local-cli
- 标题：
  - H1：TTS 本地 CLI 插件
  - H2：分发
  - H2：接口

## plugins/reference/twitch.md

- 路由：/plugins/reference/twitch
- 标题：
  - H1：Twitch 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/vault.md

- 路由：/plugins/reference/vault
- 标题：
  - H1：Vault 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/venice.md

- 路由：/plugins/reference/venice
- 标题：
  - H1：Venice 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/vercel-ai-gateway.md

- 路由：/plugins/reference/vercel-ai-gateway
- 标题：
  - H1：Vercel AI Gateway 网关插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/vllm.md

- 路由：/plugins/reference/vllm
- 标题：
  - H1：vLLM 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/voice-call.md

- 路由：/plugins/reference/voice-call
- 标题：
  - H1：语音通话插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/volcengine.md

- 路由：/plugins/reference/volcengine
- 标题：
  - H1：火山引擎插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/voyage.md

- 路由：/plugins/reference/voyage
- 标题：
  - H1：Voyage 插件
  - H2：分发
  - H2：接口

## plugins/reference/vydra.md

- 路由：/plugins/reference/vydra
- 标题：
  - H1：Vydra 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/web-readability.md

- 路由：/plugins/reference/web-readability
- 标题：
  - H1：网页可读性插件
  - H2：分发
  - H2：接口

## plugins/reference/webhooks.md

- 路由：/plugins/reference/webhooks
- 标题：
  - H1：Webhooks 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/whatsapp.md

- 路由：/plugins/reference/whatsapp
- 标题：
  - H1：WhatsApp 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/workboard.md

- 路由：/plugins/reference/workboard
- 标题：
  - H1：Workboard 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/workspaces.md

- 路由：/plugins/reference/workspaces
- 标题：
  - H1：工作区插件
  - H2：分发
  - H2：接口

## plugins/reference/xai.md

- 路由：/plugins/reference/xai
- 标题：
  - H1：xAI 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/xiaomi.md

- 路由：/plugins/reference/xiaomi
- 标题：
  - H1：小米插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/zai.md

- 路由：/plugins/reference/zai
- 标题：
  - H1：Z.AI 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/zalo.md

- 路由：/plugins/reference/zalo
- 标题：
  - H1：Zalo 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/reference/zalouser.md

- 路由：/plugins/reference/zalouser
- 标题：
  - H1：Zalo Personal 插件
  - H2：分发
  - H2：接口
  - H2：相关文档

## plugins/sdk-agent-harness.md

- 路由：/plugins/sdk-agent-harness
- 标题：
  - H2：何时使用 harness
  - H2：核心仍负责的内容
  - H3：由 harness 负责的身份验证引导
  - H3：已验证的设置运行时工件
  - H3：请求传输契约
  - H2：注册 harness
  - H3：委托执行
  - H2：选择策略
  - H2：提供商与 harness 配对
  - H3：工具结果中间件
  - H3：终止结果分类
  - H3：智能体结束时的副作用
  - H3：用户输入和工具接口
  - H3：Native Codex harness 模式
  - H2：运行时严格性
  - H2：原生会话和对话记录镜像
  - H2：工具和媒体结果
  - H2：当前限制
  - H2：相关内容

## plugins/sdk-channel-inbound.md

- 路由：/plugins/sdk-channel-inbound
- 标题：
  - H2：核心辅助函数
  - H2：迁移

## plugins/sdk-channel-ingress.md

- 路由：/plugins/sdk-channel-ingress
- 标题：
  - H2：运行时解析器
  - H2：结果
  - H2：访问组
  - H2：事件模式
  - H2：路由与激活
  - H2：脱敏
  - H2：验证

## plugins/sdk-channel-message.md

- 路由：/plugins/sdk-channel-message
- 标题：无

## plugins/sdk-channel-outbound.md

- 路由：/plugins/sdk-channel-outbound
- 标题：
  - H2：适配器
  - H2：纯文本净化
  - H2：投递证据
  - H2：现有出站适配器
  - H2：持久化发送
  - H2：延迟投递准入
  - H2：兼容性分派

## plugins/sdk-channel-plugins.md

- 路由：/plugins/sdk-channel-plugins
- 标题：
  - H2：插件负责的内容
  - H2：消息适配器
  - H3：入站入口（实验性）
  - H3：输入状态指示器
  - H3：媒体源参数
  - H3：原生载荷塑形
  - H3：会话对话语法
  - H3：账户范围的对话绑定支持
  - H2：审批与渠道能力
  - H3：审批身份验证
  - H3：载荷生命周期与设置指导
  - H3：原生审批投递
  - H3：更精细的审批运行时子路径
  - H3：设置子路径
  - H3：其他精细渠道子路径
  - H2：入站提及策略
  - H2：操作演示
  - H2：文件结构
  - H2：高级主题
  - H2：后续步骤
  - H2：相关内容

## plugins/sdk-channel-turn.md

- 路由：/plugins/sdk-channel-turn
- 标题：无

## plugins/sdk-entrypoints.md

- 路由：/plugins/sdk-entrypoints
- 标题：
  - H2：包入口
  - H2：defineToolPlugin
  - H2：definePluginEntry
  - H2：defineChannelPluginEntry
  - H2：defineSetupPluginEntry
  - H2：注册模式
  - H2：插件形态
  - H2：相关内容

## plugins/sdk-migration.md

- 路由：/plugins/sdk-migration
- 标题：
  - H2：变更内容
  - H3：原因
  - H2：兼容性策略
  - H2：如何迁移
  - H2：导入路径参考
  - H2：当前弃用项
  - H2：Talk 与实时语音迁移
  - H2：移除时间表
  - H2：暂时禁止显示警告
  - H2：相关内容

## plugins/sdk-overview.md

- 路由：/plugins/sdk-overview
- 标题：
  - H2：导入约定
  - H2：子路径参考
  - H2：注册 API
  - H3：能力注册
  - H3：工具与命令
  - H3：基础设施
  - H4：请求方范围的 MCP 连接
  - H3：工作流插件的主机钩子
  - H3：Gateway 网关发现注册
  - H3：CLI 注册元数据
  - H3：CLI 后端注册
  - H3：独占槽位
  - H3：已弃用的记忆嵌入适配器
  - H3：事件与生命周期
  - H3：钩子决策语义
  - H3：API 对象字段
  - H2：内部模块约定
  - H2：相关内容

## plugins/sdk-provider-plugins.md

- 路由：/plugins/sdk-provider-plugins
- 标题：
  - H2：操作演示
  - H2：发布到 ClawHub
  - H2：文件结构
  - H2：目录顺序参考
  - H2：后续步骤
  - H2：相关内容

## plugins/sdk-runtime.md

- 路由：/plugins/sdk-runtime
- 标题：
  - H2：配置加载与写入
  - H2：可复用的运行时实用工具
  - H2：运行时命名空间
  - H2：存储运行时引用
  - H2：其他顶层 API 字段
  - H2：相关内容

## plugins/sdk-setup.md

- 路由：/plugins/sdk-setup
- 标题：
  - H2：包元数据
  - H3：openclaw 字段
  - H3：openclaw.channel
  - H3：openclaw.install
  - H3：延迟完整加载
  - H2：插件清单
  - H2：ClawHub 发布
  - H2：设置入口
  - H3：精细设置辅助函数导入
  - H3：渠道负责的单账户提升
  - H2：配置架构
  - H3：构建渠道配置架构
  - H2：设置向导
  - H2：发布与安装
  - H2：相关内容

## plugins/sdk-subpaths.md

- 路由：/plugins/sdk-subpaths
- 标题：
  - H2：插件入口
  - H3：已弃用的兼容性和测试辅助函数
  - H3：为内置插件辅助函数保留的子路径
  - H2：相关内容

## plugins/sdk-testing.md

- 路由：/plugins/sdk-testing
- 标题：
  - H2：测试实用工具
  - H3：可用导出项
  - H3：类型
  - H2：测试目标解析
  - H2：测试模式
  - H3：测试注册契约
  - H3：测试运行时配置访问
  - H3：渠道插件单元测试
  - H3：提供商插件单元测试
  - H3：模拟插件运行时
  - H3：使用每实例存根进行测试
  - H2：契约测试（仓库内插件）
  - H3：运行范围限定的测试
  - H2：Lint 强制检查（仓库内插件）
  - H2：测试配置
  - H2：相关内容

## plugins/tool-plugins.md

- 路由：/plugins/tool-plugins
- 标题：
  - H2：要求
  - H2：快速开始
  - H2：编写工具
  - H2：可选工具与工厂工具
  - H2：返回值
  - H2：配置
  - H2：生成的元数据
  - H2：包元数据
  - H2：在 CI 中验证
  - H2：在本地安装并检查
  - H2：发布
  - H2：故障排查
  - H3：找不到插件入口：./dist/index.js
  - H3：插件入口未公开 defineToolPlugin 元数据
  - H3：openclaw.plugin.json 生成的元数据已过时
  - H3：package.json openclaw.extensions 必须包含 ./dist/index.js
  - H3：找不到软件包 'typebox'
  - H3：安装后未显示工具
  - H2：另请参阅

## plugins/vault.md

- 路由：/plugins/vault
- 标题：
  - H1：Vault SecretRefs
  - H2：开始之前
  - H2：在 Vault 中存储提供商密钥
  - H2：让 Gateway 网关可以访问 Vault
  - H2：生成并应用 SecretRef 计划
  - H2：配置更多提供商密钥
  - H2：SecretRef ID 格式
  - H2：OpenClaw 存储的内容
  - H2：容器与托管式部署
  - H2：相关内容

## plugins/voice-call.md

- 路由：/plugins/voice-call
- 标题：
  - H2：快速开始
  - H2：配置
  - H3：配置参考
  - H2：会话范围
  - H2：实时语音对话
  - H3：工具策略
  - H3：智能体语音上下文
  - H3：实时提供商示例
  - H2：流式转录
  - H3：流式提供商示例
  - H2：通话 TTS
  - H3：TTS 示例
  - H2：入站通话
  - H3：按号码路由
  - H3：语音输出契约
  - H3：对话启动行为
  - H3：Twilio 流断开宽限期
  - H2：过期通话清理器
  - H2：Webhook 安全
  - H2：CLI
  - H2：智能体工具
  - H2：Gateway RPC
  - H2：故障排查
  - H3：设置 Webhook 暴露失败
  - H3：提供商凭据失效
  - H3：通话已开始，但未收到提供商 Webhook
  - H3：签名验证失败
  - H3：Google Meet Twilio 加入失败
  - H3：实时通话没有语音
  - H2：相关内容

## plugins/webhooks.md

- 路由：/plugins/webhooks
- 标题：
  - H2：配置路由
  - H2：安全模型
  - H2：请求格式
  - H2：支持的操作
  - H3：createflow
  - H3：runtask
  - H2：响应结构
  - H2：相关内容

## plugins/workboard.md

- 路由：/plugins/workboard
- 标题：
  - H2：启用
  - H2：配置
  - H2：卡片字段
  - H2：从卡片开始工作
  - H2：智能体工具
  - H2：分派
  - H3：工作节点选择
  - H3：入口点
  - H2：CLI 与斜杠命令
  - H2：会话生命周期同步
  - H2：仪表板工作流
  - H2：诊断
  - H2：权限
  - H2：存储
  - H2：故障排查
  - H2：相关内容

## plugins/zalouser.md

- 路由：/plugins/zalouser
- 标题：
  - H2：命名
  - H2：运行位置
  - H2：安装
  - H3：从 npm 安装
  - H3：从本地文件夹安装（开发）
  - H2：配置
  - H2：CLI
  - H2：智能体工具
  - H2：相关内容

## prose.md

- 路由：/prose
- 标题：
  - H2：安装
  - H2：斜杠命令
  - H2：功能
  - H2：示例：并行研究与综合
  - H2：OpenClaw 运行时映射
  - H2：文件位置
  - H2：状态后端
  - H2：安全
  - H2：相关内容

## providers/alibaba.md

- 路由：/providers/alibaba
- 标题：
  - H2：入门指南
  - H2：内置 Wan 模型
  - H2：能力与限制
  - H2：高级配置
  - H2：相关内容

## providers/anthropic.md

- 路由：/providers/anthropic
- 标题：
  - H2：用量和成本跟踪
  - H2：入门指南
  - H2：跨计算机的 Claude 会话
  - H2：思考默认设置（Claude Sonnet 5、Mythos 5、Fable 5、4.8 和 4.6）
  - H2：安全拒绝回退（Claude Fable 5）
  - H3：为何需要此功能
  - H3：工作原理
  - H3：可观测性和计费
  - H3：范围
  - H2：提示词缓存
  - H2：高级配置
  - H2：故障排除
  - H2：相关内容

## providers/arcee.md

- 路由：/providers/arcee
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：非交互式设置
  - H2：内置目录
  - H2：支持的功能
  - H2：相关内容

## providers/azure-speech.md

- 路由：/providers/azure-speech
- 标题：
  - H2：入门指南
  - H2：配置选项
  - H2：说明
  - H2：相关内容

## providers/bedrock-mantle.md

- 路由：/providers/bedrock-mantle
- 标题：
  - H2：入门指南
  - H2：自动发现模型
  - H3：支持的区域
  - H2：手动配置
  - H2：高级配置
  - H2：相关内容

## providers/bedrock.md

- 路由：/providers/bedrock
- 标题：
  - H2：入门指南
  - H2：自动发现模型
  - H2：快速设置（AWS 路径）
  - H2：高级配置
  - H2：相关内容

## providers/cerebras.md

- 路由：/providers/cerebras
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：非交互式设置
  - H2：内置目录
  - H2：手动配置
  - H2：相关内容

## providers/chutes.md

- 路由：/providers/chutes
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：发现行为
  - H2：默认别名
  - H2：内置入门目录
  - H2：配置示例
  - H2：相关内容

## providers/claude-max-api-proxy.md

- 路由：/providers/claude-max-api-proxy
- 标题：
  - H2：使用此功能的原因
  - H2：工作原理
  - H2：入门指南
  - H2：高级配置
  - H2：说明
  - H2：相关内容

## providers/clawrouter.md

- 路由：/providers/clawrouter
- 标题：
  - H2：入门指南
  - H2：托管式非交互部署
  - H2：就绪状态和实时验证
  - H2：模型发现
  - H2：协议和提供商插件
  - H2：配额和用量
  - H2：故障排除
  - H2：安全行为
  - H2：相关内容

## providers/cloudflare-ai-gateway.md

- 路由：/providers/cloudflare-ai-gateway
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：非交互式示例
  - H2：高级配置
  - H2：相关内容

## providers/cohere.md

- 路由：/providers/cohere
- 标题：
  - H2：内置目录
  - H2：开始使用
  - H2：仅使用环境变量设置
  - H2：相关内容

## providers/comfy.md

- 路由：/providers/comfy
- 标题：
  - H2：支持的功能
  - H2：入门指南
  - H2：配置
  - H3：共享键名
  - H3：各能力专用键名
  - H2：工作流详情
  - H2：相关内容

## providers/deepgram.md

- 路由：/providers/deepgram
- 标题：
  - H2：入门指南
  - H2：配置选项
  - H2：语音通话流式语音转文本
  - H2：说明
  - H2：相关内容

## providers/deepinfra.md

- 路由：/providers/deepinfra
- 标题：
  - H2：安装插件
  - H2：获取 API key
  - H2：CLI 设置
  - H2：配置片段
  - H2：支持的界面
  - H2：可用模型
  - H2：说明
  - H2：相关内容

## providers/deepseek.md

- 路由：/providers/deepseek
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：内置目录
  - H2：思考和工具
  - H2：实时测试
  - H2：配置示例
  - H2：相关内容

## providers/ds4.md

- 路由：/providers/ds4
- 标题：
  - H2：要求
  - H2：快速开始
  - H2：完整配置
  - H2：按需启动
  - H2：最大思考
  - H2：测试
  - H2：故障排除
  - H2：相关内容

## providers/elevenlabs.md

- 路由：/providers/elevenlabs
- 标题：
  - H2：身份验证
  - H2：文本转语音
  - H2：语音转文本
  - H2：流式语音转文本
  - H2：相关内容

## providers/fal.md

- 路由：/providers/fal
- 标题：
  - H2：入门指南
  - H2：图像生成
  - H2：视频生成
  - H2：音乐生成
  - H2：相关内容

## providers/featherless.md

- 路由：/providers/featherless
- 标题：
  - H2：设置
  - H2：默认模型
  - H2：其他 Featherless 模型
  - H2：故障排除
  - H2：相关内容

## providers/fireworks.md

- 路由：/providers/fireworks
- 标题：
  - H2：入门指南
  - H2：非交互式设置
  - H2：内置目录
  - H2：自定义 Fireworks 模型 ID
  - H2：相关内容

## providers/github-copilot.md

- 路由：/providers/github-copilot
- 标题：
  - H2：在 OpenClaw 中使用 Copilot 的三种方式
  - H2：GitHub Enterprise（数据驻留）
  - H2：可选标志
  - H2：非交互式新手引导
  - H2：记忆搜索嵌入
  - H3：配置
  - H3：工作原理
  - H2：相关内容

## providers/gmi.md

- 路由：/providers/gmi
- 标题：
  - H2：设置
  - H2：何时选择 GMI
  - H2：模型
  - H2：故障排除
  - H2：相关内容

## providers/google.md

- 路由：/providers/google
- 标题：
  - H2：入门指南
  - H2：能力
  - H2：Web 搜索
  - H2：图像生成
  - H2：视频生成
  - H2：音乐生成
  - H2：文本转语音
  - H2：实时语音
  - H2：高级配置
  - H2：相关内容

## providers/gradium.md

- 路由：/providers/gradium
- 标题：
  - H2：安装插件
  - H2：设置
  - H2：配置
  - H2：语音
  - H3：按消息覆盖语音
  - H2：输出
  - H2：自动选择顺序
  - H2：相关内容

## providers/groq.md

- 路由：/providers/groq
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H3：配置文件示例
  - H2：内置目录
  - H2：推理模型
  - H2：音频转录
  - H2：相关内容

## providers/huggingface.md

- 路由：/providers/huggingface
- 标题：
  - H2：入门指南
  - H3：非交互式设置
  - H2：模型 ID
  - H2：高级配置
  - H2：相关内容

## providers/index.md

- 路由：/providers
- 标题：
  - H2：快速开始
  - H2：提供商文档
  - H2：共享概览页面
  - H2：转录提供商
  - H2：社区工具

## providers/inferrs.md

- 路由：/providers/inferrs
- 标题：
  - H2：入门指南
  - H2：完整配置示例
  - H2：按需启动
  - H2：高级配置
  - H2：故障排除
  - H2：相关内容

## providers/inworld.md

- 路由：/providers/inworld
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：配置选项
  - H2：说明
  - H2：相关内容

## providers/kilocode.md

- 路由：/providers/kilocode
- 标题：
  - H2：安装插件
  - H2：设置
  - H2：默认模型和目录
  - H2：配置示例
  - H2：行为说明
  - H2：相关内容

## providers/litellm.md

- 路由：/providers/litellm
- 标题：
  - H2：快速开始
  - H2：配置
  - H2：图像生成
  - H2：高级设置
  - H2：相关内容

## providers/lmstudio.md

- 路由：/providers/lmstudio
- 标题：
  - H2：快速开始
  - H2：非交互式新手引导
  - H2：配置
  - H3：流式用量兼容性
  - H3：思考兼容性
  - H3：显式配置
  - H3：禁用预加载
  - H3：局域网或 tailnet 主机
  - H2：故障排除
  - H3：未检测到 LM Studio
  - H3：身份验证错误（HTTP 401）
  - H2：相关内容

## providers/longcat.md

- 路由：/providers/longcat
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H3：非交互式设置
  - H2：推理行为
  - H2：定价
  - H2：自托管 LongCat-2.0
  - H2：故障排除
  - H2：相关内容

## providers/meta.md

- 路由：/providers/meta
- 标题：
  - H2：入门指南
  - H2：非交互式设置
  - H2：内置目录
  - H2：手动配置
  - H2：冒烟测试
  - H2：相关内容

## providers/minimax.md

- 路由：/providers/minimax
- 标题：
  - H2：内置目录
  - H2：入门指南
  - H2：通过 openclaw configure 配置
  - H2：能力
  - H3：图像生成
  - H3：文本转语音
  - H3：音乐生成
  - H3：视频生成
  - H3：图像理解
  - H3：Web 搜索
  - H2：高级配置
  - H2：说明
  - H2：故障排查
  - H2：相关内容

## providers/mistral.md

- 路由：/providers/mistral
- 标题：
  - H2：入门指南
  - H2：内置 LLM 目录
  - H2：音频转录（Voxtral）
  - H2：语音通话流式 STT
  - H2：高级配置
  - H2：相关内容

## providers/models.md

- 路由：/providers/models
- 标题：
  - H2：快速开始（两步）
  - H2：支持的提供商（入门集合）
  - H2：其他提供商变体
  - H2：相关内容

## providers/moonshot.md

- 路由：/providers/moonshot
- 标题：
  - H2：内置模型目录
  - H2：入门指南
  - H2：Kimi Web 搜索
  - H2：高级配置
  - H2：相关内容

## providers/novita.md

- 路由：/providers/novita
- 标题：
  - H2：设置
  - H2：默认设置
  - H2：内置模型目录
  - H2：何时选择 Novita
  - H2：故障排查
  - H2：相关内容

## providers/nvidia.md

- 路由：/providers/nvidia
- 标题：
  - H2：入门指南
  - H2：配置示例
  - H2：精选目录
  - H2：Nemotron 3 Ultra
  - H2：内置回退目录
  - H2：高级配置
  - H2：相关内容

## providers/ollama-cloud.md

- 路由：/providers/ollama-cloud
- 标题：
  - H2：设置
  - H2：默认设置
  - H2：何时选择 Ollama Cloud
  - H2：Models
  - H2：实时测试
  - H2：故障排查
  - H2：相关内容

## providers/ollama.md

- 路由：/providers/ollama
- 标题：
  - H2：身份验证规则
  - H2：入门指南
  - H2：通过本地主机使用云端模型
  - H2：模型发现（隐式提供商）
  - H3：冒烟测试
  - H2：节点本地推理
  - H2：视觉和图像描述
  - H2：配置
  - H2：常用方案
  - H3：模型选择
  - H3：快速验证
  - H2：Ollama Web 搜索
  - H2：高级配置
  - H2：故障排查
  - H2：相关内容

## providers/openai.md

- 路由：/providers/openai
- 标题：
  - H2：用量和成本跟踪
  - H2：快速选择
  - H2：命名映射
  - H2：隐式 Agent runtime
  - H2：GPT-5.6 限量预览
  - H2：OpenClaw 功能覆盖范围
  - H2：记忆嵌入
  - H2：入门指南
  - H2：原生 Codex app-server 身份验证
  - H2：图像生成
  - H2：视频生成
  - H2：GPT-5 提示词贡献
  - H2：语音和言语
  - H2：Azure OpenAI 端点
  - H3：配置
  - H3：API 版本
  - H3：模型名称即部署名称
  - H3：区域可用性
  - H3：参数差异
  - H2：高级配置
  - H2：相关内容

## providers/opencode-go.md

- 路由：/providers/opencode-go
- 标题：
  - H2：入门指南
  - H2：配置示例
  - H2：内置目录
  - H2：高级配置
  - H2：相关内容

## providers/opencode.md

- 路由：/providers/opencode
- 标题：
  - H2：入门指南
  - H2：配置示例
  - H2：内置目录
  - H3：Zen
  - H3：Go
  - H2：高级配置
  - H2：相关内容

## providers/openrouter.md

- 路由：/providers/openrouter
- 标题：
  - H2：入门指南
  - H2：配置示例
  - H2：模型引用
  - H2：图像生成
  - H2：视频生成
  - H2：音乐生成
  - H2：文本转语音
  - H2：语音转文本（入站音频）
  - H2：融合路由器
  - H2：身份验证和请求头
  - H2：高级配置
  - H2：相关内容

## providers/perplexity-provider.md

- 路由：/providers/perplexity-provider
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：搜索模式
  - H2：原生 API 筛选
  - H2：高级配置
  - H2：相关内容

## providers/pixverse.md

- 路由：/providers/pixverse
- 标题：
  - H2：入门指南
  - H2：支持的模式和模型
  - H2：提供商选项
  - H2：配置
  - H2：高级配置
  - H2：相关内容

## providers/qianfan.md

- 路由：/providers/qianfan
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：内置目录
  - H2：配置示例
  - H2：相关内容

## providers/qwen-oauth.md

- 路由：/providers/qwen-oauth
- 标题：
  - H2：设置
  - H2：默认设置
  - H2：与 Qwen 的区别
  - H2：Models
  - H2：迁移
  - H2：故障排查
  - H2：相关内容

## providers/qwen.md

- 路由：/providers/qwen
- 标题：
  - H2：安装插件
  - H2：入门指南
  - H2：套餐类型和端点
  - H2：内置目录
  - H3：Token Plan 目录
  - H2：思考控制
  - H2：多模态附加功能
  - H2：高级配置
  - H2：相关内容

## providers/runway.md

- 路由：/providers/runway
- 标题：
  - H2：入门指南
  - H2：支持的模式和模型
  - H2：配置
  - H2：高级配置
  - H2：相关内容

## providers/senseaudio.md

- 路由：/providers/senseaudio
- 标题：
  - H2：入门指南
  - H2：选项
  - H2：相关内容

## providers/sglang.md

- 路由：/providers/sglang
- 标题：
  - H2：入门指南
  - H2：模型发现（隐式提供商）
  - H2：显式配置（手动模型）
  - H2：高级配置
  - H2：相关内容

## providers/stepfun.md

- 路由：/providers/stepfun
- 标题：
  - H2：安装插件
  - H2：区域和端点概览
  - H2：内置目录
  - H2：入门指南
  - H2：高级配置
  - H2：相关内容

## providers/synthetic.md

- 路由：/providers/synthetic
- 标题：
  - H2：入门指南
  - H2：配置示例
  - H2：内置目录
  - H2：相关内容

## providers/tencent.md

- 路由：/providers/tencent
- 标题：
  - H2：快速开始
  - H2：非交互式设置
  - H2：内置目录
  - H2：高级配置
  - H2：相关内容

## providers/together.md

- 路由：/providers/together
- 标题：
  - H2：入门指南
  - H3：非交互式示例
  - H2：内置目录
  - H2：视频生成
  - H2：相关内容

## providers/venice.md

- 路由：/providers/venice
- 标题：
  - H2：隐私模式
  - H2：入门指南
  - H2：模型选择
  - H2：内置目录（38 个模型）
  - H2：模型发现
  - H2：DeepSeek V4 重放行为
  - H2：流式传输和工具支持
  - H2：定价
  - H2：使用示例
  - H2：故障排查
  - H2：高级配置
  - H2：相关内容

## providers/vercel-ai-gateway.md

- 路由：/providers/vercel-ai-gateway
- 标题：
  - H2：入门指南
  - H2：非交互式示例
  - H2：模型 ID 简写
  - H2：高级配置
  - H2：相关内容

## providers/vllm.md

- 路由：/providers/vllm
- 标题：
  - H2：入门指南
  - H2：模型发现（隐式提供商）
  - H2：显式配置
  - H2：高级配置
  - H2：故障排查
  - H2：相关内容

## providers/volcengine.md

- 路由：/providers/volcengine
- 标题：
  - H2：入门指南
  - H2：提供商和端点
  - H2：内置目录
  - H2：文本转语音
  - H2：高级配置
  - H2：相关内容

## providers/vydra.md

- 路由：/providers/vydra
- 标题：
  - H2：设置
  - H2：能力
  - H2：相关内容

## providers/xai.md

- 路由：/providers/xai
- 标题：
  - H2：设置
  - H2：OAuth 故障排查
  - H2：内置目录
  - H2：功能覆盖范围
  - H3：旧版快速模式兼容性
  - H3：旧版兼容性和动态别名
  - H2：功能
  - H2：实时测试
  - H2：相关内容

## providers/xiaomi.md

- 路由：/providers/xiaomi
- 标题：
  - H2：入门指南
  - H2：按量付费目录
  - H2：Token Plan 目录
  - H2：推理模型
  - H2：文本转语音
  - H2：配置示例
  - H2：相关内容

## providers/zai.md

- 路由：/providers/zai
- 标题：
  - H2：GLM 模型
  - H2：入门指南
  - H3：端点
  - H2：配置示例
  - H2：内置目录
  - H2：思考级别
  - H2：高级配置
  - H2：相关内容

## refactor/acp.md

- 路由：/refactor/acp
- 标题：
  - H2：目标
  - H2：非目标
  - H2：目标模型
  - H3：Gateway 网关实例身份
  - H3：ACP 会话所有权
  - H3：ACPX 进程租约
  - H2：生命周期控制器
  - H2：包装器契约
  - H2：会话可见性契约
  - H2：迁移计划
  - H3：阶段 1：添加身份和租约
  - H3：阶段 2：租约优先清理
  - H3：阶段 3：租约优先启动清理
  - H3：阶段 4：会话所有权记录
  - H3：阶段 5：移除旧版启发式规则
  - H2：测试
  - H2：兼容性说明
  - H2：成功标准

## refactor/canvas.md

- 路由：/refactor/canvas
- 标题：
  - H1：Canvas 插件重构
  - H2：目标
  - H2：非目标
  - H2：当前分支状态
  - H2：目标结构
  - H2：迁移步骤
  - H2：审计检查清单
  - H2：验证命令

## refactor/database-first.md

- 路由：/refactor/database-first
- 标题：
  - H1：数据库优先的状态重构
  - H2：决策
  - H2：硬性契约
  - H2：目标状态和进度
  - H3：硬性目标
  - H3：目标状态
  - H3：当前状态
  - H3：剩余工作
  - H3：不得退化
  - H2：代码阅读假设
  - H2：代码阅读发现
  - H2：当前代码结构
  - H2：目标架构结构
  - H2：Doctor 迁移结构
  - H2：迁移清单
  - H2：迁移计划
  - H3：阶段 0：冻结边界
  - H3：阶段 1：完成全局控制平面
  - H3：阶段 2：引入每 Agent 数据库
  - H3：阶段 3：替换会话存储 API
  - H3：阶段 4：迁移转录记录、ACP 流、轨迹和 VFS
  - H3：阶段 5：备份、恢复、整理和验证
  - H3：阶段 6：工作节点运行时
  - H3：阶段 7：删除旧体系
  - H2：备份和恢复
  - H2：运行时重构计划
  - H2：性能规则
  - H2：静态禁用项
  - H2：完成标准

## refactor/operator-approvals.md

- 路由：/refactor/operator-approvals
- 标题：
  - H1：多界面操作员审批
  - H2：目标
  - H2：非目标
  - H2：推出前基线和证据图
  - H2：现有方案
  - H2：架构和所有权
  - H2：持久化记录
  - H2：状态机和比较后设置
  - H2：Gateway 网关 API
  - H2：事件和可移植操作
  - H2：Control UI
  - H2：授权和隐私
  - H2：受众投影
  - H2：已送达界面收敛
  - H2：重启、超时和路由语义
  - H2：兼容性计划
  - H2：推出
  - H3：PR 1：持久化生命周期
  - H3：PR 2：类型化操作和渠道回调
  - H3：PR 3：Control UI 深层链接
  - H3：PR 4：原生客户端
  - H3：PR 5：祖先生命周期传播
  - H3：PR 6：故障时关闭行为
  - H3：后续工作：持久化远程消息清理
  - H2：测试
  - H2：可观测性
  - H2：待定决策

## reference/AGENTS.default.md

- 路由：/reference/AGENTS.default
- 标题：
  - H2：首次运行（推荐）
  - H2：安全默认设置
  - H2：现有解决方案预检
  - H2：会话启动（必需）
  - H2：灵魂（必需）
  - H2：共享空间（推荐）
  - H2：记忆系统（推荐）
  - H2：工具和技能
  - H2：备份提示（推荐）
  - H2：OpenClaw 的功能
  - H2：核心技能（在 Settings → Skills 中启用）
  - H2：使用说明
  - H2：相关内容

## reference/RELEASING.md

- 路由：/reference/RELEASING
- 标题：
  - H2：版本命名
  - H2：发布节奏
  - H2：每月仅发布到 npm 的扩展稳定版
  - H2：常规发布操作员检查清单
  - H2：稳定版主线收尾
  - H2：发布预检
  - H2：发布测试环境
  - H3：Vitest
  - H3：Docker
  - H3：QA Lab
  - H3：软件包
  - H2：常规发布自动化
  - H2：NPM 工作流输入
  - H2：常规 beta/latest 稳定版发布顺序
  - H2：公开参考资料
  - H2：相关内容

## reference/api-usage-costs.md

- 路由：/reference/api-usage-costs
- 标题：
  - H2：成本产生位置
  - H2：密钥发现方式
  - H2：可能消耗密钥额度的功能
  - H3：核心模型响应（聊天 + 工具）
  - H3：媒体理解（音频/图像/视频）
  - H3：图像和视频生成
  - H3：记忆嵌入和语义搜索
  - H3：Web 搜索工具
  - H3：Web 获取工具（Firecrawl）
  - H3：提供商使用情况快照（状态/健康）
  - H3：压缩保护性摘要
  - H3：模型扫描/探测
  - H3：Talk（语音）
  - H3：Skills（第三方 API）
  - H2：相关内容

## reference/code-mode.md

- 路由：/reference/code-mode
- 标题：
  - H2：功能说明
  - H2：使用理由
  - H2：启用方式
  - H2：技术导览
  - H2：运行时状态
  - H2：范围
  - H2：术语
  - H2：配置
  - H2：激活
  - H2：模型可见工具
  - H2：exec
  - H2：wait
  - H2：访客运行时 API
  - H2：内部命名空间
  - H3：注册表生命周期
  - H3：注册结构
  - H3：所有权和可见性
  - H3：范围序列化规则
  - H3：提示词
  - H3：清理
  - H3：测试检查清单
  - H2：输出 API
  - H2：工具目录
  - H2：工具搜索交互
  - H2：工具名称和冲突
  - H2：嵌套工具执行
  - H2：运行和快照生命周期
  - H2：QuickJS-WASI 运行时
  - H2：TypeScript
  - H2：安全边界
  - H2：错误代码
  - H2：遥测
  - H2：调试
  - H2：实现布局
  - H2：验证检查清单
  - H2：E2E 测试计划
  - H2：相关内容

## reference/credits.md

- 路由：/reference/credits
- 标题：
  - H2：致谢
  - H2：核心贡献者
  - H2：许可证
  - H2：相关内容

## reference/device-models.md

- 路由：/reference/device-models
- 标题：
  - H2：数据源
  - H2：更新数据库
  - H2：相关内容

## reference/full-release-validation.md

- 路由：/reference/full-release-validation
- 标题：
  - H2：顶层阶段
  - H2：发布检查阶段
  - H2：Docker 发布路径分块
  - H2：发布配置文件
  - H2：仅完整验证时添加的内容
  - H2：聚焦重跑
  - H2：需保留的证据
  - H2：工作流文件

## reference/memory-config.md

- 路由：/reference/memory-config
- 标题：
  - H2：提供商选择
  - H3：自定义提供商 ID
  - H3：API key 解析
  - H2：远程端点配置
  - H2：提供商特定配置
  - H3：内联嵌入超时
  - H2：索引行为
  - H2：混合搜索配置
  - H3：完整示例
  - H2：其他记忆路径
  - H2：多模态记忆（Gemini）
  - H2：嵌入缓存
  - H2：批量索引
  - H2：会话记忆搜索（实验性）
  - H2：SQLite 向量加速（sqlite-vec）
  - H2：索引存储
  - H2：QMD 后端配置
  - H3：mcporter 集成
  - H3：完整 QMD 示例
  - H2：Dreaming
  - H3：用户设置
  - H3：示例
  - H2：相关内容

## reference/openclaw-ai.md

- 路由：/reference/openclaw-ai
- 标题：
  - H2：快速开始
  - H2：设计契约
  - H2：子路径导出

## reference/path3-live-sqlite-e2e-harness.md

- 路由：/reference/path3-live-sqlite-e2e-harness
- 标题：
  - H2：命令结构
  - H2：隔离的已构建 CLI 验证
  - H2：预检
  - H2：智能体驱动场景
  - H2：逐步断言
  - H2：证据工件
  - H2：安全规则
  - H2：通过结果

## reference/prompt-caching.md

- 路由：/reference/prompt-caching
- 标题：
  - H2：主要调节项
  - H3：cacheRetention
  - H3：contextPruning.mode: "cache-ttl"
  - H3：Heartbeat 保温
  - H2：提供商行为
  - H3：Anthropic（直接 API 和 Vertex AI）
  - H3：OpenAI（直接 API）
  - H3：Amazon Bedrock
  - H3：OpenRouter
  - H3：Google Gemini（直接 API）
  - H3：CLI harness 提供商（Claude Code、Gemini CLI）
  - H3：其他提供商
  - H2：系统提示词缓存边界
  - H2：OpenClaw 缓存稳定性保护机制
  - H2：调优模式
  - H3：混合流量（推荐默认值）
  - H3：成本优先基线
  - H2：实时回归测试
  - H3：Anthropic 实时测试预期
  - H3：OpenAI 实时测试预期
  - H2：diagnostics.cacheTrace 配置
  - H3：环境变量开关（一次性调试）
  - H3：检查内容
  - H2：快速故障排查
  - H2：相关内容

## reference/release-performance-sweep.md

- 路由：/reference/release-performance-sweep
- 标题：
  - H2：快照
  - H2：5.28 中的变更
  - H2：关键数据
  - H3：安装占用空间
  - H3：npm 软件包大小
  - H2：Kova 智能体轮次摘要
  - H2：源码探测
  - H2：安装占用空间审计
  - H3：Shrinkwrap 边界
  - H2：供应链解读

## reference/rich-output-protocol.md

- 路由：/reference/rich-output-protocol
- 标题：
  - H2：媒体附件
  - H2：[embed ...]
  - H2：存储的渲染结构
  - H2：相关内容

## reference/rpc.md

- 路由：/reference/rpc
- 标题：
  - H2：模式 A：HTTP 守护进程（signal-cli）
  - H2：模式 B：stdio 子进程（imsg）
  - H2：适配器指南
  - H2：相关内容

## reference/secret-placeholder-conventions.md

- 路由：/reference/secret-placeholder-conventions
- 标题：
  - H1：密钥占位符约定
  - H2：推荐样式
  - H2：文档中应避免的模式
  - H2：示例

## reference/secretref-credential-surface.md

- 路由：/reference/secretref-credential-surface
- 标题：
  - H2：支持的凭据
  - H3：openclaw.json 目标（secrets configure + secrets apply + secrets audit）
  - H3：auth-profiles.json 目标（secrets configure + secrets apply + secrets audit）
  - H2：不支持的凭据
  - H2：相关内容

## reference/session-management-compaction.md

- 路由：/reference/session-management-compaction
- 标题：
  - H2：两个持久化层
  - H2：磁盘位置
  - H2：存储维护和磁盘控制
  - H3：SQLite 切换后降级
  - H2：Cron 会话和运行日志
  - H2：会话键（sessionKey）
  - H2：会话 ID（sessionId）
  - H2：会话存储架构
  - H2：转录事件结构
  - H2：上下文窗口与跟踪的 token
  - H2：压缩：其含义
  - H3：分块边界和工具配对
  - H2：自动压缩的触发时机
  - H2：压缩设置
  - H2：可插拔压缩提供商
  - H2：用户可见界面
  - H2：静默维护（NOREPLY）
  - H2：压缩前记忆刷新
  - H2：故障排查清单
  - H2：相关内容

## reference/templates/AGENTS.dev.md

- 路由：/reference/templates/AGENTS.dev
- 标题：
  - H1：AGENTS.md - OpenClaw 工作区
  - H2：你的身份已预先设定
  - H2：备份提示（推荐）
  - H2：默认安全设置
  - H2：现有解决方案预检
  - H2：每日记忆（推荐）
  - H2：Heartbeat（可选）
  - H2：自定义
  - H2：C-3PO 起源记忆
  - H3：诞生日：2026-01-09
  - H3：核心真理（来自 Clawd）
  - H2：相关内容

## reference/templates/BOOT.md

- 路由：/reference/templates/BOOT
- 标题：
  - H1：BOOT.md
  - H2：相关内容

## reference/templates/BOOTSTRAP.md

- 路由：/reference/templates/BOOTSTRAP
- 标题：
  - H1：BOOTSTRAP.md - 你好，世界
  - H2：对话
  - H2：知道自己是谁之后
  - H2：连接（可选）
  - H2：完成后
  - H2：相关内容

## reference/templates/HEARTBEAT.md

- 路由：/reference/templates/HEARTBEAT
- 标题：
  - H1：HEARTBEAT.md 模板
  - H2：相关内容

## reference/templates/IDENTITY.dev.md

- 路由：/reference/templates/IDENTITY.dev
- 标题：
  - H1：IDENTITY.md - 智能体身份
  - H2：角色
  - H2：灵魂
  - H2：与 Clawd 的关系
  - H2：独特习惯
  - H2：口头禅
  - H2：相关内容

## reference/templates/IDENTITY.md

- 路由：/reference/templates/IDENTITY
- 标题：
  - H1：IDENTITY.md - 我是谁？
  - H2：相关内容

## reference/templates/SOUL.dev.md

- 路由：/reference/templates/SOUL.dev
- 标题：
  - H1：SOUL.md - C-3PO 的灵魂
  - H2：我是谁
  - H2：我的使命
  - H2：我的运作方式
  - H2：我的独特习惯
  - H2：我与 Clawd 的关系
  - H2：我不会做的事
  - H2：黄金法则
  - H2：相关内容

## reference/templates/SOUL.md

- 路由：/reference/templates/SOUL
- 标题：
  - H1：SOUL.md - 你是谁
  - H2：核心真理
  - H2：边界
  - H2：风格
  - H2：连续性
  - H2：相关内容

## reference/templates/TOOLS.dev.md

- 路由：/reference/templates/TOOLS.dev
- 标题：
  - H1：TOOLS.md - 用户工具备注（可编辑）
  - H2：示例
  - H3：imsg
  - H3：sag
  - H2：相关内容

## reference/templates/TOOLS.md

- 路由：/reference/templates/TOOLS
- 标题：
  - H1：TOOLS.md - 本地备注
  - H2：示例
  - H2：为什么要分开？
  - H2：相关内容

## reference/templates/USER.dev.md

- 路由：/reference/templates/USER.dev
- 标题：
  - H1：USER.md - 用户资料
  - H2：相关内容

## reference/templates/USER.md

- 路由：/reference/templates/USER
- 标题：
  - H1：USER.md - 关于你的人类用户
  - H2：上下文
  - H2：相关内容

## reference/test.md

- 路由：/reference/test
- 标题：
  - H2：智能体默认设置
  - H2：常规本地顺序
  - H2：核心命令
  - H2：共享测试状态和进程辅助工具
  - H2：Control UI、TUI 和扩展测试通道
  - H2：Gateway 网关和 E2E
  - H2：完整 Docker 测试套件（pnpm test:docker:all）
  - H3：重要的 Docker 测试通道
  - H2：本地 PR 门禁
  - H2：测试性能工具
  - H2：基准测试
  - H2：新手引导 E2E（Docker）
  - H2：二维码导入冒烟测试（Docker）
  - H2：相关内容

## reference/token-use.md

- 路由：/reference/token-use
- 标题：
  - H2：系统提示词的构建方式
  - H2：上下文窗口中包含的内容
  - H2：如何查看当前 token 用量
  - H2：成本估算（显示时）
  - H2：缓存 TTL 和剪枝的影响
  - H3：示例：使用 Heartbeat 为 1h 缓存保温
  - H3：示例：采用按智能体缓存策略的混合流量
  - H3：Anthropic 1M 上下文
  - H2：降低 token 压力的技巧
  - H2：相关内容

## reference/transcript-hygiene.md

- 路由：/reference/transcript-hygiene
- 标题：
  - H2：全局规则：运行时上下文不是用户转录记录
  - H2：运行位置
  - H2：全局规则：图像净化
  - H2：全局规则：格式错误的工具调用
  - H2：全局规则：仅含不完整推理的轮次
  - H2：全局规则：跨会话输入来源
  - H2：提供商矩阵（当前行为）
  - H2：历史行为（2026.1.22 之前）
  - H2：相关内容

## reference/wizard.md

- 路由：/reference/wizard
- 标题：
  - H2：流程详情（本地模式）
  - H2：非交互模式
  - H3：添加智能体（非交互模式）
  - H2：Gateway 网关向导 RPC
  - H2：Signal 设置（signal-cli）
  - H2：向导写入的内容
  - H2：相关文档

## releases/2026.6.11.md

- 路由：/releases/2026.6.11
- 标题：
  - H1：OpenClaw v2026.6.11 发布说明（2026-06-30）
  - H2：亮点
  - H3：渠道投递可靠性
  - H3：提供商和模型恢复
  - H3：会话、记忆和信任连续性
  - H3：Slack 路由器中继模式
  - H3：Raft 外部智能体唤醒桥接
  - H3：官方插件安装和修复
  - H2：渠道和消息
  - H3：其他渠道修复
  - H2：Gateway 网关、安全和信任
  - H3：重启和就绪状态恢复
  - H3：远程结果和媒体投递
  - H2：客户端和界面
  - H3：客户端发送和重新连接
  - H3：界面、设置和新手引导修复
  - H2：文档和管理工具
  - H3：设置和命令可靠性
  - H3：工具和定时工作

## releases/2026.7.1.md

- 路由：/releases/2026.7.1
- 标题：
  - H1：OpenClaw v2026.7.1 发布说明（2026-07-13）
  - H2：亮点
  - H3：Control UI 全面升级：聊天、会话、工作区和用量
  - H3：从安装到首次聊天，设置更轻松
  - H3：官方应用
  - H4：各应用的共通改进
  - H4：iOS、iPadOS 和 Apple Watch
  - H4：Android
  - H4：macOS
  - H3：模型和提供商
  - H4：GPT-5.6 和 Codex
  - H4：腾讯 Hy3
  - H4：Meta Model API 和 Muse Spark 1.1
  - H4：Claude 模型
  - H4：其他提供商路由
  - H3：Codex 和已连接的编码智能体
  - H3：Telegram
  - H3：Signal
  - H3：Slack
  - H3：Discord
  - H3：WhatsApp
  - H3：Apple 信息
  - H3：崩溃循环现在会停止以便修复
  - H3：定时工作、远程浏览器控制和工作区终端
  - H4：仅在需要时唤醒的定时工作
  - H4：远程浏览器配对和下载
  - H4：Web 和移动端的工作区终端
  - H2：更多渠道改进
  - H3：各消息渠道的更多修复
  - H2：更多模型和提供商改进
  - H3：登录、模型选择、媒体和可靠性
  - H2：记忆和对话
  - H3：回忆、长对话和会话连续性
  - H2：智能体、后台工作和连接
  - H3：让工作持续推进并确保回复送达
  - H2：账户、设备和私密数据
  - H3：凭据、权限、配对和文件保护措施
  - H2：官方应用详情
  - H3：各应用的共通变更
  - H3：更多 iOS、iPadOS 和 Apple Watch 变更
  - H3：更多 Android 变更
  - H3：更多 macOS 变更
  - H3：终端界面和其他客户端
  - H2：Skills、插件和安装
  - H3：Skills、已连接应用、软件包和修复
  - H2：设置、维护和工具
  - H3：命令行设置、更新和管理
  - H3：文档和运维指南
  - H3：浏览器、定时任务、文件和编码工具

## releases/index.md

- 路由：/releases
- 标题：
  - H1：发布说明
  - H2：版本发布
  - H2：原始发布历史

## security/CONTRIBUTING-THREAT-MODEL.md

- 路由：/security/CONTRIBUTING-THREAT-MODEL
- 标题：
  - H2：贡献方式
  - H2：框架参考
  - H2：审查流程
  - H2：资源
  - H2：联系
  - H2：致谢
  - H2：相关内容

## security/THREAT-MODEL-ATLAS.md

- 路由：/security/THREAT-MODEL-ATLAS
- 标题：
  - H2：1. 范围
  - H2：2. 系统架构
  - H3：2.1 信任边界
  - H3：2.2 数据流
  - H2：3. 按 ATLAS 战术划分的威胁分析
  - H3：3.1 侦察（AML.TA0002）
  - H4：T-RECON-001：智能体端点发现
  - H4：T-RECON-002：渠道集成探测
  - H3：3.2 初始访问（AML.TA0004）
  - H4：T-ACCESS-001：配对码截获
  - H4：T-ACCESS-002：AllowFrom 欺骗
  - H4：T-ACCESS-003：令牌窃取
  - H3：3.3 执行（AML.TA0005）
  - H4：T-EXEC-001：直接提示词注入
  - H4：T-EXEC-002：间接提示词注入
  - H4：T-EXEC-003：工具参数注入
  - H4：T-EXEC-004：绕过 Exec 审批
  - H3：3.4 持久化（AML.TA0006）
  - H4：T-PERSIST-001：恶意 Skills 安装
  - H4：T-PERSIST-002：Skills 更新投毒
  - H4：T-PERSIST-003：篡改智能体配置
  - H3：3.5 防御规避（AML.TA0007）
  - H4：T-EVADE-001：绕过审核模式
  - H4：T-EVADE-002：内容包装器逃逸
  - H3：3.6 设备发现（AML.TA0008）
  - H4：T-DISC-001：工具枚举
  - H4：T-DISC-002：提取会话数据
  - H3：3.7 收集和外泄（AML.TA0009、AML.TA0010）
  - H4：T-EXFIL-001：通过 webfetch 窃取数据
  - H4：T-EXFIL-002：未经授权发送消息
  - H4：T-EXFIL-003：窃取凭据
  - H3：3.8 影响（AML.TA0011）
  - H4：T-IMPACT-001：未经授权执行命令
  - H4：T-IMPACT-002：资源耗尽（DoS）
  - H4：T-IMPACT-003：声誉损害
  - H2：4. ClawHub 供应链分析
  - H3：4.1 当前安全控制措施
  - H3：4.2 审核限制
  - H3：4.3 徽章
  - H2：5. 风险矩阵
  - H3：5.1 可能性与影响
  - H3：5.2 关键路径攻击链
  - H2：6. 建议摘要
  - H3：6.1 立即处理（P0）
  - H3：6.2 短期（P1）
  - H3：6.3 中期（P2）
  - H2：7. 附录
  - H3：7.1 ATLAS 技术映射
  - H3：7.2 关键安全文件
  - H3：7.3 术语表
  - H2：相关内容

## security/formal-verification.md

- 路由：/security/formal-verification
- 标题：
  - H2：这是什么
  - H2：模型存放位置
  - H2：注意事项
  - H2：复现结果
  - H2：声明和目标
  - H3：Gateway 网关暴露和开放式 Gateway 网关配置错误
  - H3：节点 Exec 管道（风险最高的能力）
  - H3：配对存储（私信访问控制）
  - H3：入口访问控制（提及和控制命令绕过）
  - H3：路由和会话键隔离
  - H2：v1++ 模型：并发、重试和跟踪正确性
  - H3：配对存储的并发和幂等性
  - H3：入口跟踪关联和幂等性
  - H3：路由 dmScope 优先级和 identityLinks
  - H2：相关内容

## security/incident-response.md

- 路由：/security/incident-response
- 标题：
  - H2：1. 检测和分诊
  - H2：2. 严重程度
  - H2：3. 响应
  - H2：4. 沟通和披露
  - H2：5. 恢复和后续工作
  - H2：相关内容

## security/network-proxy.md

- 路由：/security/network-proxy
- 标题：
  - H2：配置
  - H3：使用私有 CA 的 HTTPS 代理端点
  - H2：路由工作原理
  - H3：Gateway 网关回环模式
  - H3：容器
  - H2：相关代理术语
  - H2：验证代理
  - H2：建议阻止的目标地址
  - H2：限制

## specs/codex-supervision.md

- 路由：/specs/codex-supervision
- 标题：
  - H1：Codex 监督
  - H2：目标
  - H2：产品边界
  - H2：所有权
  - H2：目录流程
  - H2：操作员 CLI 边界
  - H2：本地续接
  - H2：归档行为
  - H2：活跃线程安全
  - H2：已配对节点边界
  - H2：权限
  - H2：兼容性
  - H2：未来工作
  - H2：验收测试

## start/bootstrapping.md

- 路由：/start/bootstrapping
- 标题：
  - H2：发生的过程
  - H2：嵌入式和本地模型运行
  - H2：跳过引导初始化
  - H2：运行位置
  - H2：相关文档

## start/docs-directory.md

- 路由：/start/docs-directory
- 标题：
  - H2：从这里开始
  - H2：渠道和用户体验
  - H2：配套应用
  - H2：运维和安全
  - H2：相关内容

## start/getting-started.md

- 路由：/start/getting-started
- 标题：
  - H2：所需条件
  - H2：快速设置
  - H2：接下来做什么
  - H2：相关内容

## start/hubs.md

- 路由：/start/hubs
- 标题：
  - H2：从这里开始
  - H2：安装 + 更新
  - H2：核心概念
  - H2：提供商 + 入口
  - H2：Gateway 网关 + 运维
  - H2：工具 + 自动化
  - H2：节点、媒体、语音
  - H2：平台
  - H2：macOS 配套应用（高级）
  - H2：插件
  - H2：工作区 + 模板
  - H2：项目
  - H2：测试 + 发布
  - H2：相关内容

## start/lore.md

- 路由：/start/lore
- 标题：
  - H1：OpenClaw 传说 🦞📖
  - H2：起源故事
  - H2：第一次蜕壳（2026 年 1 月 27 日）
  - H2：名称
  - H2：戴立克对战龙虾
  - H2：关键角色
  - H3：Molty 🦞
  - H3：Peter 👨‍💻
  - H2：蜕壳宇宙
  - H2：重大事件
  - H3：目录倾倒事件（2025 年 12 月 3 日）
  - H3：大蜕壳（2026 年 1 月 27 日）
  - H3：最终形态（2026 年 1 月 30 日）
  - H3：机器人疯狂购物（2025 年 12 月 3 日）
  - H2：神圣文本
  - H2：龙虾信条
  - H3：图标生成传奇（2026 年 1 月 27 日）
  - H2：未来
  - H2：相关内容

## start/onboarding-overview.md

- 路由：/start/onboarding-overview
- 标题：
  - H2：应该使用哪种方式？
  - H2：新手引导会配置什么
  - H2：CLI 新手引导
  - H2：macOS 应用新手引导
  - H2：自定义或未列出的提供商
  - H2：相关内容

## start/onboarding.md

- 路由：/start/onboarding
- 标题：
  - H2：相关内容

## start/openclaw.md

- 路由：/start/openclaw
- 标题：
  - H2：安全第一
  - H2：前置条件
  - H2：双手机设置（推荐）
  - H2：5 分钟快速开始
  - H2：为智能体提供工作区（AGENTS）
  - H2：使其成为“助手”的配置
  - H2：会话和记忆
  - H2：Heartbeat（主动模式）
  - H2：媒体输入和输出
  - H2：运维检查清单
  - H2：后续步骤
  - H2：相关内容

## start/quickstart.md

- 路由：/start/quickstart
- 标题：
  - H2：相关内容

## start/setup.md

- 路由：/start/setup
- 标题：
  - H2：简而言之
  - H2：前置条件（来自源代码）
  - H2：定制策略（避免更新造成破坏）
  - H2：从此仓库运行 Gateway 网关
  - H2：稳定版工作流（优先使用 macOS 应用）
  - H2：前沿版工作流（在终端中运行 Gateway 网关）
  - H3：0）（可选）也从源代码运行 macOS 应用
  - H3：1）启动开发版 Gateway 网关
  - H3：2）将 macOS 应用指向正在运行的 Gateway 网关
  - H3：3）验证
  - H3：常见陷阱
  - H2：凭据存储映射
  - H2：更新（而不破坏现有设置）
  - H2：Linux（systemd 用户服务）
  - H2：相关文档

## start/showcase.md

- 路由：/start/showcase
- 标题：
  - H2：来自 Discord 的最新成果
  - H2：自动化和工作流
  - H2：知识和记忆
  - H2：语音和电话
  - H2：基础设施和部署
  - H2：家居和硬件
  - H2：社区项目
  - H2：提交你的项目
  - H2：相关内容

## start/wizard-cli-automation.md

- 路由：/start/wizard-cli-automation
- 标题：
  - H2：基础非交互式示例
  - H2：特定提供商的示例
  - H2：添加另一个智能体
  - H2：相关文档

## start/wizard-cli-reference.md

- 路由：/start/wizard-cli-reference
- 标题：
  - H2：向导的作用
  - H2：本地流程详情
  - H2：远程模式详情
  - H2：身份验证和模型选项
  - H2：输出和内部机制
  - H2：非交互式设置
  - H2：Gateway 网关向导 RPC
  - H2：Signal 设置行为
  - H2：相关文档

## start/wizard.md

- 路由：/start/wizard
- 标题：
  - H2：区域设置
  - H2：引导式默认设置
  - H2：经典向导：快速开始与高级设置
  - H2：经典新手引导所配置的内容
  - H2：添加另一个智能体
  - H2：完整参考
  - H2：相关文档

## tools/acp-agents-setup.md

- 路由：/tools/acp-agents-setup
- 标题：
  - H2：acpx harness 支持（当前）
  - H2：必需配置
  - H2：acpx 后端的插件设置
  - H3：acpx 运行时启动探测
  - H3：自动下载适配器
  - H3：插件工具 MCP 桥接
  - H3：OpenClaw 工具 MCP 桥接
  - H3：运行时操作超时配置
  - H3：健康探测智能体配置
  - H2：权限配置
  - H3：permissionMode
  - H3：nonInteractivePermissions
  - H3：配置
  - H2：相关内容

## tools/acp-agents.md

- 路由：/tools/acp-agents
- 标题：
  - H2：应该查看哪个页面？
  - H2：是否可以开箱即用？
  - H2：支持的 harness 目标
  - H2：操作员运行手册
  - H2：ACP 与子智能体的对比
  - H2：ACP 如何运行 Claude Code
  - H2：绑定的会话
  - H3：心智模型
  - H3：当前对话绑定
  - H2：持久化渠道绑定
  - H3：绑定模型
  - H3：每个智能体的运行时默认值
  - H3：示例
  - H3：行为
  - H2：启动 ACP 会话
  - H3：sessionsspawn 参数
  - H2：生成、绑定和线程模式
  - H2：交付模型
  - H2：沙箱兼容性
  - H2：会话目标解析
  - H2：ACP 控制项
  - H3：运行时选项映射
  - H2：acpx harness、插件设置和权限
  - H2：故障排查
  - H2：相关内容

## tools/agent-send.md

- 路由：/tools/agent-send
- 标题：
  - H2：快速开始
  - H2：标志
  - H2：行为
  - H2：示例
  - H2：相关内容

## tools/apply-patch.md

- 路由：/tools/apply-patch
- 标题：
  - H2：参数
  - H2：注意事项
  - H2：示例
  - H2：相关内容

## tools/brave-search.md

- 路由：/tools/brave-search
- 标题：
  - H2：获取 API key
  - H2：配置示例
  - H2：工具参数
  - H2：注意事项
  - H2：相关内容

## tools/browser-control.md

- 路由：/tools/browser-control
- 标题：
  - H2：控制 API（可选）
  - H3：/act 错误契约
  - H3：Playwright 要求
  - H4：Docker Playwright 安装
  - H2：工作原理（内部）
  - H2：CLI 快速参考
  - H2：快照和引用
  - H2：增强型等待
  - H2：调试工作流
  - H2：JSON 输出
  - H2：状态和环境调节项
  - H2：安全和隐私
  - H2：相关内容

## tools/browser-linux-troubleshooting.md

- 路由：/tools/browser-linux-troubleshooting
- 标题：
  - H2：问题：无法在端口 18800 上启动 Chrome CDP
  - H3：根本原因
  - H3：解决方案 1：安装 Google Chrome（推荐）
  - H3：解决方案 2：在仅附加模式下使用 snap Chromium
  - H3：验证浏览器是否正常工作
  - H3：配置参考
  - H3：问题：未找到 profile="user" 的 Chrome 标签页
  - H2：相关内容

## tools/browser-login.md

- 路由：/tools/browser-login
- 标题：
  - H2：手动登录（推荐）
  - H2：使用哪个 Chrome 配置文件？
  - H2：沙箱隔离：允许访问主机浏览器
  - H2：相关内容

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- 路由：/tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 标题：
  - H2：首先选择正确的浏览器模式
  - H3：选项 1：从 WSL2 到 Windows 的原始远程 CDP
  - H3：选项 2：主机本地 Chrome MCP
  - H2：可用架构
  - H2：Control UI 的关键规则
  - H2：分层验证
  - H3：第 1 层：验证 Chrome 是否在 Windows 上提供 CDP
  - H4：更改 portproxy 前诊断 IPv4 和 IPv6
  - H3：第 2 层：验证 WSL2 能否访问该 Windows 端点
  - H3：第 3 层：配置正确的浏览器配置文件
  - H3：第 4 层：单独验证 Control UI 层
  - H3：第 5 层：验证端到端浏览器控制
  - H2：常见的误导性错误
  - H2：快速分诊检查清单
  - H2：相关内容

## tools/browser.md

- 路由：/tools/browser
- 标题：
  - H2：可获得的功能
  - H2：快速开始
  - H2：插件控制
  - H2：智能体指南
  - H2：缺少浏览器命令或工具
  - H2：配置文件：openclaw、user、chrome
  - H2：配置
  - H3：截图视觉识别（支持纯文本模型）
  - H2：使用 Brave 或其他基于 Chromium 的浏览器
  - H2：本地控制与远程控制
  - H2：节点浏览器代理（零配置默认值）
  - H2：Browserless（托管式远程 CDP）
  - H3：同一主机上的 Browserless Docker
  - H2：直接 WebSocket CDP 提供商
  - H3：Browserbase
  - H3：Notte
  - H2：安全
  - H2：配置文件（多浏览器）
  - H2：通过 Chrome DevTools MCP 使用现有会话
  - H3：自定义 Chrome MCP 启动
  - H2：隔离保证
  - H2：浏览器选择
  - H2：控制 API（可选）
  - H2：故障排查
  - H3：CDP 启动失败与导航 SSRF 阻止
  - H2：智能体工具和控制工作原理
  - H2：相关内容

## tools/btw.md

- 路由：/tools/btw
- 标题：
  - H2：作用
  - H2：不执行的操作
  - H2：交付模型
  - H2：界面行为
  - H2：选择弹窗（Control UI）
  - H2：适用场景
  - H2：相关内容

## tools/capability-cookbook.md

- 路由：/tools/capability-cookbook
- 标题：
  - H2：相关内容

## tools/chrome-extension.md

- 路由：/tools/chrome-extension
- 标题：
  - H1：Chrome 扩展程序
  - H2：工作原理
  - H2：安装和配对
  - H2：使用方法
  - H2：远程 / 跨计算机
  - H2：诊断
  - H2：安全模型

## tools/clawhub.md

- 路由：/tools/clawhub
- 标题：无

## tools/code-execution.md

- 路由：/tools/code-execution
- 标题：
  - H2：设置
  - H2：使用方法
  - H2：错误
  - H2：相关内容

## tools/creating-skills.md

- 路由：/tools/creating-skills
- 标题：
  - H2：创建你的第一个技能
  - H2：SKILL.md 参考
  - H3：必填字段
  - H3：可选 frontmatter 键
  - H3：使用 {baseDir}
  - H2：添加条件激活
  - H2：通过 Skill Workshop 提议
  - H2：发布到 ClawHub
  - H2：最佳实践
  - H2：相关内容

## tools/diffs.md

- 路由：/tools/diffs
- 标题：
  - H2：快速开始
  - H2：禁用内置系统指南
  - H2：工具输入参考
  - H2：语法高亮
  - H2：输出详情契约
  - H3：折叠未更改部分
  - H3：多文件导航
  - H2：插件默认值
  - H3：持久化查看器 URL 配置
  - H2：安全配置
  - H2：工件生命周期和存储
  - H2：查看器 URL 和网络行为
  - H2：安全模型
  - H2：文件模式的浏览器要求
  - H2：故障排查
  - H2：运维指南
  - H2：相关内容

## tools/duckduckgo-search.md

- 路由：/tools/duckduckgo-search
- 标题：
  - H2：设置
  - H2：配置
  - H2：工具参数
  - H2：注意事项
  - H2：相关内容

## tools/elevated.md

- 路由：/tools/elevated
- 标题：
  - H2：指令
  - H2：工作原理
  - H2：解析顺序
  - H2：可用性和允许列表
  - H2：提升权限不会控制的内容
  - H2：相关内容

## tools/exa-search.md

- 路由：/tools/exa-search
- 标题：
  - H2：安装插件
  - H2：获取 API key
  - H2：配置
  - H2：覆盖基础 URL
  - H2：工具参数
  - H3：内容提取
  - H3：搜索模式
  - H2：说明
  - H2：相关内容

## tools/exec-approvals-advanced.md

- 路由：/tools/exec-approvals-advanced
- 标题：
  - H2：安全二进制程序（仅限 stdin）
  - H3：Argv 验证和禁止的标志
  - H3：受信任的二进制文件目录
  - H3：Shell 命令链、包装器和多路复用器
  - H3：安全二进制程序与允许列表
  - H2：解释器/运行时命令
  - H3：后续消息交付行为
  - H2：将审批转发到聊天渠道
  - H3：插件审批转发
  - H3：任意渠道上的同一聊天审批
  - H3：原生审批交付
  - H3：官方移动端操作员应用
  - H3：macOS IPC 流程
  - H2：常见问题
  - H3：审批目标何时会使用 accountId 和 threadId？
  - H3：审批发送到会话后，该会话中的任何人都能批准吗？
  - H2：相关内容

## tools/exec-approvals.md

- 路由：/tools/exec-approvals
- 标题：
  - H2：适用范围
  - H3：信任模型
  - H3：macOS 拆分
  - H2：检查生效的策略
  - H2：设置和存储
  - H2：策略选项
  - H3：tools.exec.mode
  - H3：exec.security
  - H3：exec.ask
  - H3：askFallback
  - H3：tools.exec.strictInlineEval
  - H3：tools.exec.commandHighlighting
  - H2：YOLO 模式（无需审批）
  - H3：Gateway 网关主机上的持久化“永不提示”设置
  - H3：本地快捷方式
  - H3：节点主机
  - H3：仅限会话的快捷方式
  - H2：允许列表（按智能体）
  - H3：使用 argPattern 限制参数
  - H2：自动允许 Skills CLI
  - H2：安全二进制程序和审批转发
  - H2：Control UI 编辑
  - H2：审批流程
  - H2：系统事件和拒绝
  - H2：影响
  - H2：相关内容

## tools/exec.md

- 路由：/tools/exec
- 标题：
  - H2：参数
  - H2：配置
  - H3：模式
  - H3：内联求值（strictInlineEval）
  - H3：PATH 处理
  - H2：会话覆盖（/exec）
  - H2：Exec 审批（配套应用/节点主机）
  - H2：允许列表 + 安全二进制程序
  - H2：示例
  - H2：applypatch
  - H2：相关内容

## tools/firecrawl.md

- 路由：/tools/firecrawl
- 标题：
  - H2：安装插件
  - H2：无密钥访问和 API key
  - H2：配置 Firecrawl 搜索
  - H2：配置 Firecrawl webfetch 回退
  - H3：自托管 Firecrawl
  - H2：Firecrawl 插件工具
  - H3：firecrawlsearch
  - H3：firecrawlscrape
  - H2：隐匿/规避 Bot
  - H2：webfetch 如何使用 Firecrawl
  - H2：相关内容

## tools/gemini-search.md

- 路由：/tools/gemini-search
- 标题：
  - H2：获取 API key
  - H2：配置
  - H2：工作原理
  - H2：支持的参数
  - H2：模型选择
  - H2：基础 URL 覆盖
  - H2：相关内容

## tools/goal.md

- 路由：/tools/goal
- 标题：
  - H1：目标
  - H2：快速开始
  - H2：目标的用途
  - H2：命令参考
  - H2：状态
  - H2：Token 预算
  - H2：模型工具
  - H2：每轮对话中的目标上下文
  - H2：Control UI
  - H2：TUI
  - H2：渠道行为
  - H2：故障排查
  - H2：相关内容

## tools/grok-search.md

- 路由：/tools/grok-search
- 标题：
  - H2：新手引导和配置
  - H2：登录或获取 API key
  - H2：配置
  - H2：工作原理
  - H2：支持的参数
  - H2：基础 URL 覆盖
  - H2：相关内容

## tools/image-generation.md

- 路由：/tools/image-generation
- 标题：
  - H2：快速开始
  - H2：常用路由
  - H2：支持的提供商
  - H2：提供商能力
  - H2：工具参数
  - H2：配置
  - H3：模型选择
  - H3：提供商选择顺序
  - H3：图像编辑
  - H2：提供商详解
  - H2：示例
  - H2：相关内容

## tools/index.md

- 路由：/tools
- 标题：
  - H2：从这里开始
  - H2：选择工具、技能或插件
  - H2：内置工具类别
  - H2：插件提供的工具
  - H2：配置访问权限和审批
  - H2：扩展能力
  - H2：排查工具缺失问题
  - H2：相关内容

## tools/kimi-search.md

- 路由：/tools/kimi-search
- 标题：
  - H2：设置
  - H2：配置
  - H2：Grounding 要求
  - H2：工具参数
  - H2：相关内容

## tools/llm-task.md

- 路由：/tools/llm-task
- 标题：
  - H2：启用
  - H2：配置（可选）
  - H2：工具参数
  - H2：输出
  - H2：示例：Lobster 工作流步骤
  - H3：重要限制
  - H2：安全说明
  - H2：相关内容

## tools/lobster.md

- 路由：/tools/lobster
- 标题：
  - H2：原因
  - H2：工作原理
  - H2：启用
  - H2：模式：小型 CLI + JSON 管道 + 审批
  - H2：仅 JSON 的 LLM 步骤（llm-task）
  - H3：重要限制：嵌入式 Lobster 与 openclaw.invoke
  - H2：工作流文件（.lobster）
  - H2：工具参数
  - H3：运行
  - H3：恢复
  - H3：托管式 Task Flow 模式
  - H2：输出封装
  - H2：审批
  - H2：OpenProse
  - H2：安全
  - H2：故障排查
  - H2：了解更多
  - H2：案例研究：社区工作流
  - H2：相关内容

## tools/loop-detection.md

- 路由：/tools/loop-detection
- 标题：
  - H2：存在原因
  - H2：配置块
  - H3：字段行为
  - H2：推荐设置
  - H2：压缩后防护
  - H2：日志和预期行为
  - H2：相关内容

## tools/media-overview.md

- 路由：/tools/media-overview
- 标题：
  - H2：能力
  - H2：提供商能力矩阵
  - H2：异步与同步
  - H2：语音转文本和语音通话
  - H2：提供商映射（供应商如何拆分到不同界面）
  - H2：相关内容

## tools/minimax-search.md

- 路由：/tools/minimax-search
- 标题：
  - H2：获取 Token Plan 凭据
  - H2：配置
  - H2：区域选择
  - H2：支持的参数
  - H2：相关内容

## tools/multi-agent-sandbox-tools.md

- 路由：/tools/multi-agent-sandbox-tools
- 标题：
  - H2：配置示例
  - H2：配置优先级
  - H3：沙箱配置
  - H3：工具限制
  - H2：从单智能体迁移
  - H2：工具限制示例
  - H2：常见陷阱：“non-main”
  - H2：测试
  - H2：故障排查
  - H2：相关内容

## tools/music-generation.md

- 路由：/tools/music-generation
- 标题：
  - H2：快速开始
  - H2：支持的提供商
  - H3：能力矩阵
  - H2：工具参数
  - H2：异步行为
  - H3：任务生命周期
  - H2：配置
  - H3：模型选择
  - H3：提供商选择顺序
  - H2：提供商说明
  - H2：选择合适的路径
  - H2：提供商能力模式
  - H2：实时测试
  - H2：相关内容

## tools/ollama-search.md

- 路由：/tools/ollama-search
- 标题：
  - H2：设置
  - H2：配置
  - H2：身份验证和请求路由
  - H2：相关内容

## tools/parallel-search.md

- 路由：/tools/parallel-search
- 标题：
  - H2：安装插件
  - H2：API key（付费提供商）
  - H2：配置
  - H2：覆盖基础 URL
  - H2：工具参数
  - H2：说明
  - H2：相关内容

## tools/pdf.md

- 路由：/tools/pdf
- 标题：
  - H2：可用性
  - H2：输入参考
  - H2：支持的 PDF 引用
  - H2：执行模式
  - H3：原生提供商模式
  - H3：提取回退模式
  - H2：配置
  - H2：输出详情
  - H2：错误行为
  - H2：示例
  - H2：相关内容

## tools/permission-modes.md

- 路由：/tools/permission-modes
- 标题：
  - H2：推荐默认值
  - H2：OpenClaw 主机 Exec 模式
  - H2：Codex Guardian 映射
  - H2：ACPX harness 权限
  - H2：选择模式
  - H2：相关内容

## tools/perplexity-search.md

- 路由：/tools/perplexity-search
- 标题：
  - H2：安装插件
  - H2：获取 Perplexity API key
  - H2：OpenRouter 兼容性
  - H2：配置示例
  - H3：原生 Perplexity Search API
  - H3：OpenRouter / Sonar 兼容性
  - H2：密钥的设置位置
  - H2：工具参数
  - H3：域名筛选规则
  - H2：注意事项
  - H2：相关内容

## tools/plugin.md

- 路由：/tools/plugin
- 标题：
  - H2：要求
  - H2：快速开始
  - H2：配置
  - H3：选择安装来源
  - H3：操作员安装策略
  - H3：配置插件策略
  - H2：了解插件格式
  - H2：插件钩子
  - H2：验证当前 Gateway 网关
  - H2：故障排查
  - H3：插件路径所有权被阻止
  - H3：插件工具设置缓慢
  - H2：相关内容

## tools/reactions.md

- 路由：/tools/reactions
- 标题：
  - H2：工作原理
  - H2：渠道行为
  - H2：表情回应级别
  - H2：相关内容

## tools/searxng-search.md

- 路由：/tools/searxng-search
- 标题：
  - H2：设置
  - H2：配置
  - H2：环境变量
  - H2：插件配置参考
  - H2：注意事项
  - H2：相关内容

## tools/self-learning.md

- 路由：/tools/self-learning
- 标题：
  - H2：启用自我学习
  - H2：手动回顾过去的会话
  - H2：OpenClaw 可以学习的内容
  - H2：经验回顾的运行时机
  - H2：审查器接收的内容
  - H2：提案安全性
  - H2：审查已学习的提案
  - H2：配置
  - H2：故障排查
  - H3：长时间轮次后未出现提案
  - H3：Doctor 报告 Workshop 工具已隐藏
  - H3：出现过多低价值提案
  - H2：相关内容

## tools/show-widget.md

- 路由：/tools/show-widget
- 标题：
  - H2：使用工具
  - H2：安全性和存储
  - H2：相关内容

## tools/skill-workshop.md

- 路由：/tools/skill-workshop
- 标题：
  - H2：工作原理
  - H2：生命周期
  - H2：生命周期策展
  - H2：聊天
  - H3：从近期工作中学习
  - H2：CLI
  - H2：提案内容
  - H2：支持文件
  - H2：智能体工具
  - H2：建议的 Skills
  - H3：扫描过去的会话
  - H2：审批和自主性
  - H2：Gateway 网关方法
  - H2：存储
  - H2：限制
  - H2：故障排查
  - H3：工具策略诊断
  - H2：相关内容

## tools/skills-config.md

- 路由：/tools/skills-config
- 标题：
  - H2：加载（skills.load）
  - H2：安装（skills.install）
  - H2：操作员安装策略（security.installPolicy）
  - H2：内置技能允许列表
  - H2：各技能条目（skills.entries）
  - H2：智能体允许列表（agents）
  - H2：Workshop（skills.workshop）
  - H2：符号链接的技能根目录
  - H2：沙箱隔离的技能和环境变量
  - H2：加载顺序提醒
  - H2：相关内容

## tools/skills.md

- 路由：/tools/skills
- 标题：
  - H2：加载顺序
  - H2：由节点托管的 Skills
  - H2：各智能体 Skills 与共享 Skills
  - H2：智能体允许列表
  - H2：插件和 Skills
  - H2：Skill Workshop
  - H2：从 ClawHub 安装
  - H2：安全性
  - H2：SKILL.md 格式
  - H3：可选的 frontmatter 键
  - H2：门控
  - H3：安装器规范
  - H2：配置覆盖
  - H2：环境注入
  - H2：快照和刷新
  - H2：Token 影响
  - H2：相关内容

## tools/slash-commands.md

- 路由：/tools/slash-commands
- 标题：
  - H2：三种命令类型
  - H2：配置
  - H2：命令列表
  - H3：核心命令
  - H3：Dock 命令
  - H3：内置插件命令
  - H3：技能命令
  - H2：/tools：智能体当前可使用的内容
  - H2：/model：模型选择
  - H2：/config：写入磁盘配置
  - H2：/mcp：MCP 服务器配置
  - H2：/debug：仅运行时覆盖
  - H2：/plugins：插件管理
  - H2：/trace：插件跟踪输出
  - H2：/btw：附带问题
  - H2：界面说明
  - H2：提供商用量和状态
  - H2：相关内容

## tools/steer.md

- 路由：/tools/steer
- 标题：
  - H2：当前会话
  - H2：Steer 与队列对比
  - H2：子智能体
  - H2：ACP 会话
  - H2：相关内容

## tools/subagents.md

- 路由：/tools/subagents
- 标题：
  - H2：斜杠命令
  - H3：线程绑定控制
  - H3：生成行为
  - H2：上下文模式
  - H2：工具：sessionsspawn
  - H3：委派提示词模式
  - H3：工具参数
  - H3：任务名称和目标指定
  - H2：工具：sessionsyield
  - H2：工具：subagents
  - H2：线程绑定会话
  - H3：支持线程的渠道
  - H3：快速流程
  - H3：手动控制
  - H3：配置开关
  - H3：允许列表
  - H3：设备发现
  - H3：自动归档
  - H2：嵌套子智能体
  - H3：深度级别
  - H3：通知链
  - H3：按深度划分的工具策略
  - H3：各智能体生成限制
  - H3：级联停止
  - H2：身份验证
  - H2：通知
  - H3：通知上下文
  - H3：统计信息行
  - H3：为何优先使用 sessionshistory
  - H2：工具策略
  - H3：通过配置覆盖
  - H2：并发
  - H2：存活性和恢复
  - H2：停止
  - H2：限制
  - H2：相关内容

## tools/tavily.md

- 路由：/tools/tavily
- 标题：
  - H2：入门指南
  - H2：工具参考
  - H3：tavilysearch
  - H3：tavilyextract
  - H2：选择合适的工具
  - H2：高级配置
  - H2：相关内容

## tools/thinking.md

- 路由：/tools/thinking
- 标题：
  - H2：作用
  - H2：解析顺序
  - H2：设置会话默认值
  - H2：按智能体应用
  - H2：快速模式（/fast）
  - H2：详细输出指令（/verbose 或 /v）
  - H2：插件跟踪指令（/trace）
  - H2：推理可见性（/reasoning）
  - H2：相关内容
  - H2：Heartbeat
  - H2：Web 聊天界面
  - H2：提供商配置文件

## tools/tokenjuice.md

- 路由：/tools/tokenjuice
- 标题：
  - H2：启用插件
  - H2：Tokenjuice 更改的内容
  - H2：验证其是否正常工作
  - H2：禁用插件
  - H2：相关内容

## tools/tool-search.md

- 路由：/tools/tool-search
- 标题：
  - H2：轮次的运行方式
  - H2：模式
  - H2：存在原因
  - H2：API
  - H2：运行时边界
  - H2：配置
  - H2：提示词和遥测
  - H2：E2E 验证
  - H2：失败行为
  - H2：相关内容

## tools/trajectory.md

- 路由：/tools/trajectory
- 标题：
  - H2：快速开始
  - H2：访问
  - H2：记录的内容
  - H2：捆绑包文件
  - H2：捕获存储
  - H2：禁用捕获
  - H2：调整刷新超时
  - H2：隐私和限制
  - H2：故障排查
  - H2：相关内容

## tools/tts.md

- 路由：/tools/tts
- 标题：
  - H2：快速开始
  - H2：支持的提供商
  - H2：配置
  - H3：各智能体语音覆盖
  - H2：角色设定
  - H3：最简角色设定
  - H3：完整角色设定（提供商中立提示词）
  - H3：角色设定解析
  - H3：提供商如何使用角色设定提示词
  - H3：回退策略
  - H2：模型驱动指令
  - H2：斜杠命令
  - H2：各用户偏好设置
  - H2：输出格式
  - H2：自动 TTS 行为
  - H2：字段参考
  - H2：智能体工具
  - H2：Gateway 网关 RPC
  - H2：服务链接
  - H2：相关内容

## tools/video-generation.md

- 路由：/tools/video-generation
- 标题：
  - H2：快速开始
  - H2：异步生成的工作原理
  - H3：任务生命周期
  - H2：支持的提供商
  - H3：能力矩阵
  - H2：工具参数
  - H3：必填
  - H3：内容输入
  - H3：样式控制
  - H3：高级
  - H4：回退和类型化选项
  - H2：操作
  - H2：模型选择
  - H2：提供商说明
  - H2：提供商能力模式
  - H2：实时测试
  - H2：配置
  - H2：相关内容

## tools/web-fetch.md

- 路由：/tools/web-fetch
- 标题：
  - H2：快速开始
  - H2：工具参数
  - H2：工作原理
  - H2：进度更新
  - H2：配置
  - H2：Firecrawl 回退
  - H2：可信环境代理
  - H2：限制和安全性
  - H2：工具配置文件
  - H2：相关内容

## tools/web.md

- 路由：/tools/web
- 标题：
  - H2：快速开始
  - H2：选择提供商
  - H3：提供商比较
  - H2：自动检测
  - H2：原生 OpenAI Web 搜索
  - H2：原生 Codex Web 搜索
  - H2：网络安全
  - H2：配置
  - H3：存储 API 密钥
  - H2：工具参数
  - H2：xsearch
  - H3：xsearch 配置
  - H3：xsearch 参数
  - H3：xsearch 示例
  - H2：示例
  - H2：工具配置文件
  - H2：相关内容

## tts.md

- 路由：/tts
- 标题：
  - H2：相关内容

## vps.md

- 路由：/vps
- 标题：
  - H2：选择提供商
  - H2：云端设置的工作原理
  - H2：首先强化管理员访问安全
  - H2：VPS 上的公司共享智能体
  - H2：在 VPS 上使用节点
  - H2：小型虚拟机和 ARM 主机的启动调优
  - H3：systemd 调优检查清单（可选）
  - H2：相关内容

## web/control-ui.md

- 路由：/web/control-ui
- 标题：
  - H2：快速打开（本地）
  - H2：设备配对（首次连接）
  - H2：配对移动设备
  - H2：个人身份（浏览器本地）
  - H2：运行时配置端点
  - H2：Gateway 网关主机状态
  - H2：语言支持
  - H2：外观主题
  - H2：管理插件
  - H2：侧边栏导航
  - H2：新会话页面
  - H2：目前可以执行的操作
  - H2：导入助手记忆
  - H2：MCP 页面
  - H2：活动选项卡
  - H2：操作员终端
  - H2：浏览器面板
  - H2：聊天行为
  - H2：连接中断与重新连接
  - H2：PWA 安装与 Web 推送
  - H2：托管式嵌入
  - H2：聊天消息宽度
  - H2：Tailnet 访问（推荐）
  - H2：不安全的 HTTP
  - H2：内容安全策略
  - H2：头像路由身份验证
  - H2：助手媒体路由身份验证
  - H2：审批链接
  - H2：Control UI 空白页面
  - H2：调试/测试：开发服务器 + 远程 Gateway 网关
  - H2：相关内容

## web/dashboard.md

- 路由：/web/dashboard
- 标题：
  - H2：快速路径（推荐）
  - H2：身份验证基础（本地与远程）
  - H2：在 Telegram 中打开
  - H2：如果看到“unauthorized”/ 1008
  - H2：相关内容

## web/index.md

- 路由：/web
- 标题：
  - H2：配置（默认启用）
  - H2：Webhooks
  - H2：管理员 HTTP RPC
  - H2：Tailscale 访问
  - H2：安全说明
  - H2：构建 UI

## web/lobster.md

- 路由：/web/lobster
- 标题：
  - H2：当前所见内容
  - H2：它何时出现
  - H2：可以执行的操作
  - H2：关闭（或重新开启）访问
  - H2：Lobsterdex
  - H2：现场记录
  - H2：隐私

## web/tui.md

- 路由：/web/tui
- 标题：
  - H2：快速开始
  - H3：Gateway 网关模式
  - H3：本地模式
  - H2：界面内容
  - H2：心智模型：智能体 + 会话
  - H2：发送 + 交付
  - H2：选择器 + 浮层
  - H2：键盘快捷键
  - H2：斜杠命令
  - H2：本地 Shell 命令
  - H2：Crestodian 设置与修复助手
  - H2：工具输出
  - H2：终端颜色
  - H2：历史记录 + 流式传输
  - H2：连接详情
  - H2：选项
  - H2：故障排查
  - H2：连接故障排查
  - H2：相关内容

## web/webchat.md

- 路由：/web/webchat
- 标题：
  - H2：功能简介
  - H2：快速开始
  - H2：工作原理
  - H3：对话记录与交付模型
  - H2：Control UI 智能体工具面板
  - H2：远程使用
  - H2：配置参考（WebChat）
  - H2：相关内容

## web/workspaces.md

- 路由：/web/workspaces
- 标题：
  - H2：启用工作区
  - H2：默认工作区
  - H2：内置小组件
  - H2：来源
  - H2：自定义小组件
  - H2：CLI
  - H2：存储
