---
read_when:
    - 审查为什么渠道入口重构增加了过多代码
    - 将路由、命令、事件、激活或访问组策略从内置插件移入核心
    - 检查频道入口辅助函数是否真的删除了内置插件代码
sidebarTitle: Ingress core deletion
summary: 将重复的渠道入口粘合逻辑移入核心的删除优先计划。
title: 入口核心删除计划
x-i18n:
    generated_at: "2026-05-10T19:47:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# 入口核心删除计划

入口重构在增加数千行净代码时并不健康。核心集中化只有在内置插件生产代码变得更小，并且旧的第三方 SDK 兼容性被隔离到 SDK/核心适配层时才算有效。

期望的运行时形态：

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

内置插件不应把入口再转换回本地的 `AccessResult`、`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess` 或 `{ allowed, reasonCode }` 形态，除非该类型是公开的插件 API。

## 预算

以 PR 与 `origin/main` 的 merge-base 为基准测量，包括未跟踪文件。

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

最低剩余清理量：

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

仅删除注释不算清理。上一轮预算检查过于宽松，因为它包含了恢复的 QQBot 解释性注释；本文档只跟踪可执行代码、文档和测试代码的移动。

每轮清理后重新测量：

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 诊断

第一轮添加了共享入口内核，然后在旁边留下了过多插件本地授权：

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

这重复了模型。核心生产代码增加了约 3,376 行，而内置插件生产代码减少了 1,240 行。这比第一轮好，但还没有进入最低预算范围。修复仍然应以删除优先：

- 删除只重命名入口字段的插件 DTO
- 删除只断言包装器形态的测试
- 只有在同一个补丁删除内置插件代码时才添加核心助手
- 将旧 SDK 兼容性只保留在 SDK/核心适配层中
- 在包装器删除暴露出稳定形态后重新打包核心

## 热点

仍需缩减的正增长内置生产文件：

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

该分支还没有进入最低预算范围。剩余的、与评审相关的工作应先删除重复的授权流程、轮次脚手架或包装器测试，再添加另一个核心抽象。

## 当前代码阅读

健康的核心边界已经存在于 `src/channels/message-access/runtime.ts`：它负责身份适配器、有效 allowlist、配对存储读取、路由描述符、命令/事件预设、访问组，以及最终解析出的 `ResolvedChannelMessageIngress` 投影。

剩余增长主要是叠加在该边界之上的插件胶水代码：

- `extensions/telegram/src/ingress.ts` 将核心决策包装成 Telegram 特定的命令/事件助手，然后调用点仍传入预计算的规范化 allowlist 和 owner 列表。
- `extensions/discord/src/monitor/dm-command-auth.ts`、`extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts` 和 `extensions/matrix/src/matrix/monitor/access-state.ts` 仍在入口旁边保留本地策略 DTO 或旧式决策名称。
- `extensions/signal/src/monitor/access-policy.ts` 正确地将 Signal 身份规范化和配对回复保留在本地，但仍有一个包装器边界，应该折叠为直接消费入口。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、`extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts` 和 `extensions/zalouser/src/monitor.ts` 仍重复路由/envelope/轮次组装，这可以移到入口内核之外的共享轮次助手中。

结论：只有在同一个补丁中删除这些插件包装层时，把更多代码移入核心才有用。在保留包装器返回值的同时再添加一个抽象，会重复同样的错误。

## 边界

核心负责通用策略：

- allowlist 规范化和匹配
- 访问组展开和诊断
- 配对存储私信 allowlist 读取
- 路由、发送者、命令、事件和激活门控
- 准入映射：dispatch、drop、skip、observe、pairing
- 已脱敏状态、决策、诊断和 SDK 兼容性投影
- 用于身份、路由、命令、事件、激活和结果的可复用通用描述符

插件负责传输事实和副作用：

- webhook/socket/request 真实性
- 平台身份提取和 API 查询
- 渠道特定策略默认值
- 配对质询投递、回复、ack、reaction、typing、媒体、历史、设置、Doctor、Status、日志和面向用户的文案

核心必须保持渠道无关：`src/channels/message-access` 中不得出现 Discord、Slack、Telegram、Matrix、room、guild、space、API client 或插件特定默认值。

## 接受规则

每个新的核心助手都必须立即删除内置插件生产代码。

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

遇到以下情况时停止并重新设计：

- 插件生产 LOC 增加
- 测试增长快于生产代码缩减
- 内置热路径返回的 DTO 只是重命名 `ResolvedChannelMessageIngress`
- 核心助手需要渠道 id、平台对象、API client 或渠道特定默认值

## 工作包

1. 冻结预算。
   将 LOC 写入 PR，保持 deprecated-ingress lint 通过，并在清理提交中包含清理前/后的 LOC。

2. 删除薄 DTO 边界。
   用直接读取 `ResolvedChannelMessageIngress`、`senderAccess`、`commandAccess`、`routeAccess` 或 `ingress` 替换插件本地包装器返回值。先从 QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage 和 Tlon 开始。删除包装器形态测试；保留行为测试。

3. 只有配合删除时才添加结果分类。
   通用分类器可以暴露 `dispatch`、`pairing-required`、`skip-activation`、`drop-command`、`drop-route`、`drop-sender` 和 `drop-ingress`。它必须从决策图推导，而不是从原因字符串推导，并且在同一个补丁中迁移至少三个插件。

4. 只有配合删除时才添加路由描述符构建器。
   只有在能立即缩减路由密集插件时，通用路由目标和路由发送者助手才可接受：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo 和 Zalo Personal。

5. 只有配合删除时才添加命令/事件预设。
   集中文本命令、原生命令、callback 和 origin-subject 形态。命令消费者在没有运行命令门控时必须默认未授权；事件不得启动配对。

6. 只在能删除样板代码的地方添加身份预设。
   当原始值只进入适配器输入，且已脱敏状态保留不透明 id/计数时，允许 stable-id、stable-id-plus-aliases、phone/e164 和 multi-identifier 助手。

7. 共享已授权轮次组装。
   在入口内核之外，从 QA Channel、IRC、Nextcloud Talk、Zalo 和 Zalo Personal 中移除重复的路由/envelope/context/reply 脚手架。核心可以负责路由/会话/envelope/dispatch 编排；插件保留投递和渠道特定上下文。

8. 隔离兼容性。
   已废弃的 SDK 助手保持源码兼容，但内置热路径不得导入已废弃入口或命令认证 facade。兼容性测试应使用假的第三方插件，而不是内置插件内部机制。

9. 重新打包核心。
   包装器删除后，折叠一次性模块，移除未使用导出，将兼容性投影移出热路径，并保留针对身份、路由、命令/事件、激活、访问组和兼容性适配层的聚焦测试。

## 删除批次

按顺序执行。每一批都必须降低内置生产 LOC。

1. 包装器折叠，预期插件 delta：-400 到 -600。
   用直接读取 `ResolvedChannelMessageIngress` 替换插件本地 `resolveXAccess`、`resolveXCommandAccess` 和 `accessFromIngress` 结果类型。首批目标：Discord 私信命令认证、Feishu 策略、Matrix 访问状态、Telegram 入口、Signal 访问策略、QQBot SDK 适配器。

2. 共享结果助手，预期插件 delta：-200 到 -350。
   只有在它能删除至少三个插件中重复的 `shouldBlockControlCommand`、配对、激活跳过、路由阻断和发送者阻断阶梯时，才添加一个通用分类器。

3. 路由描述符构建器，预期插件 delta：-200 到 -350。
   将重复的路由目标和路由发送者描述符组装移入核心助手。首批目标：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、Zalo Personal。

4. 轮次组装共享，预期插件 delta：-250 到 -450。
   对简单入口插件使用通用路由/会话/envelope/dispatch 编排。首批目标：QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. 核心重新打包，预期核心 delta：-300 到 -700。
   在插件直接消费运行时投影后，删除一次性模块，将小文件合并回 `runtime.ts` 或聚焦的兄弟文件，并让 SDK 兼容性文件与内置热路径保持分离。

6. 测试修剪，预期测试 delta：-300 到 -600。
   删除只断言已移除包装器形态的测试。保留针对命令拒绝、群组回退、origin-subject 匹配、激活跳过、访问组、配对和脱敏的行为测试。

这些批次之后的预期最低落地形态：

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 不要移动

不要移动平台配置默认值、设置 UX、doctor/fix 文案、API 查找、
Slack 所有者在线状态检查、Matrix 别名/验证处理、Telegram
回调解析、命令语法解析、原生命令注册、reaction
载荷解析、配对回复、命令回复、确认、正在输入、媒体、历史记录、
或日志。

## 验证

定向本地循环：

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

一旦 LOC 趋势进入预算范围，就使用 Testbox 做广泛变更门禁/完整套件证明。

每个工作包记录：

- 按类别统计的前后 LOC
- 已删除的插件包装器
- 新增核心辅助函数 LOC（如有）
- 已运行的定向测试
- 剩余热点列表

## 退出标准

- 内置生产导入不再使用已弃用的 channel-access 或 command-auth 门面
- 兼容代码隔离在 SDK/核心边界
- 内置插件直接消费入口投影或通用结果
- 插件生产 LOC 相对于 `origin/main` 至少净减少 1,500
- 核心生产 LOC <= +1,500；若超出，则需抵消多余部分，同时总量保持
  <= +2,000
- 代表性测试覆盖修订、路由、命令/事件、激活、
  访问组以及特定渠道回退行为
