---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: qa-lab、qa-channel、种子化场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-12T19:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 栈旨在以比单个单元测试更贴近真实、
更符合渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具备私信、渠道、线程、
  表情回应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、
  注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的启动任务种子资源和基线 QA
  场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 风格的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关通道，并暴露
QA Lab 页面，供操作员或自动化循环为智能体分配 QA
任务、观察真实渠道行为，并记录哪些有效、哪些失败，或哪些仍然受阻。

如果你想更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，
可使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务基于预构建镜像运行，并将
`extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch`
会在变更时重建该 bundle，而当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行一个具备真实传输层的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的
driver、SUT 和 observer 用户，创建一个私有房间，然后在一个 QA Gateway 网关子进程中运行真实的 Matrix 插件。实时传输通道会将子配置限定在待测传输协议上，因此 Matrix 可以在子配置中不带
`qa-channel` 运行。

若要运行一个具备真实传输层的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会定位到一个真实的私有 Telegram 群组，而不是配置一次性服务器。
它要求设置 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个
私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在
`@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人间的观察效果最佳。

实时传输通道现在共享一个更小的统一契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖面更广的合成产品行为测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道     | Canary | 提及门控 | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | 表情回应观察 | 帮助命令 |
| -------- | ------ | -------- | ------------ | -------- | -------- | ------------ | -------- | ------------ | -------- |
| Matrix   | x      | x        | x            | x        | x        | x            | x        | x            |          |
| Telegram | x      |          |              |          |          |              |          |              | x        |

这样可以保持 `qa-channel` 作为覆盖广泛产品行为的测试套件，同时让 Matrix、
Telegram 以及未来的实时传输协议共享一份明确的传输契约检查清单。

若要运行一个一次性的 Linux VM 通道，并且不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 客户机，在客机中安装依赖、构建 OpenClaw、
运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的
`.artifacts/qa-e2e/...`。
它复用了与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 的 suite 运行默认都会以多个隔离的 Gateway 网关工作进程并行执行多个选定场景，最多 64 个工作进程或达到所选场景数量上限。使用 `--concurrency <count>` 调整工作进程数量，或使用
`--concurrency 1` 进行串行执行。
实时运行会转发适合客机使用的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的
`CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样客机才能通过挂载的工作区写回结果。

## 仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些内容有意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用的 markdown 运行器。每个场景 markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 文档和代码引用
- 可选插件要求
- 可选 Gateway 网关配置补丁
- 可执行的 `qa-flow`

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 传输适配器

`qa-lab` 拥有针对 markdown QA 场景的通用传输层接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：
未来无论是真实还是合成渠道，都应接入同一个 suite 运行器，
而不是再添加一个传输协议专用的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、产物写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪性、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时表面。

面向维护者的新渠道适配器接入指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍然受阻
- 哪些后续场景值得添加

对于角色与风格检查，可在多个实时模型引用上运行同一场景，
并写出一份带评审结果的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在接受评估。该命令会保留每份完整对话记录，记录基础运行统计信息，然后让评审模型以快速模式和
`xhigh` 推理等级，按自然度、氛围和幽默感对各次运行进行排序。
当比较不同提供商时，使用 `--blind-judge-models`：评审提示仍会获得
每份对话记录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；报告会在解析完成后将排序结果映射回真实引用。
候选运行默认使用 `high` 思考等级，对于支持它的 OpenAI 模型则使用
`xhigh`。使用
`--model provider/model,thinking=<level>` 可内联覆盖某个特定候选模型。`--thinking <level>` 仍会设置全局回退值，而较旧的
`--model-thinking <provider/model=level>` 形式则为了兼容性继续保留。
OpenAI 候选引用默认使用快速模式，以便在提供商支持的地方使用优先处理。
当某个候选或评审需要单独覆盖时，可内联添加 `,fast`、`,no-fast` 或
`,fast=false`。只有当你想为每个候选模型都强制开启快速模式时，才传入 `--fast`。
报告中会记录候选和评审的运行时长以供基准分析，但评审提示会明确说明
不要按速度进行排序。
候选运行和评审模型运行默认并发度都为 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，可降低
`--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
