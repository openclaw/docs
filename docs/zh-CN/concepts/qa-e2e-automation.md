---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高拟真度的 QA 自动化
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-23T09:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 栈旨在以比单个单元测试更贴近真实、具备渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、表情回应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的启动任务种子资源和基线 QA 场景。

当前 QA 操作流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（控制 UI）。
- 右侧：QA Lab，显示类似 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点、启动基于 Docker 的 gateway 测试通道，并暴露 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容成功了、失败了，或仍然受阻。

如果你想更快迭代 QA Lab UI，而不必每次都重建 Docker 镜像，可以使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在预构建镜像上运行，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

若要运行一个基于真实传输层的 Matrix 冒烟测试通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的驱动、SUT 和观察者用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix 插件。实时传输通道会将子进程配置限定在被测试的传输协议上，因此 Matrix 会在子进程配置中不包含 `qa-channel` 的情况下运行。它会将结构化报告产物以及合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若还要捕获外层 `scripts/run-node.mjs` 的构建/启动输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。

若要运行一个基于真实传输层的 Telegram 冒烟测试通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会使用一个真实的私有 Telegram 群组，而不是配置一次性服务器。它要求提供 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的 bot 位于同一个私有群组中。SUT bot 必须具有 Telegram 用户名；如果两个 bot 都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode，则 bot 对 bot 的观察效果最佳。  
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不以失败退出码结束，请使用 `--allow-failures`。  
Telegram 报告和摘要还会包含每次回复的 RTT，从驱动消息发送请求开始，到观察到 SUT 回复为止，金丝雀场景也包括在内。

实时传输通道现在共享一个更小的契约，而不是各自设计自己的场景列表结构：

`qa-channel` 仍然是更广泛的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | 金丝雀 | 提及门控 | 白名单拦截 | 顶层回复 | 重启恢复 | 线程后续回复 | 线程隔离 | 表情回应观察 | 帮助命令 |
| ---- | ------ | -------- | ---------- | -------- | -------- | ------------ | -------- | ------------ | -------- |
| Matrix   | x      | x        | x          | x        | x        | x            | x        | x            |          |
| Telegram | x      |          |            |          |          |              |          |              | x        |

这样可以让 `qa-channel` 继续作为广泛的产品行为套件，而 Matrix、Telegram 以及未来的实时传输协议共享一份显式的传输契约检查清单。

若要运行一个一次性的 Linux VM 通道，而不将 Docker 纳入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。  
它会复用与主机上 `qa suite` 相同的场景选择行为。  
主机和 Multipass 的 suite 运行默认都会并行执行多个选中的场景，并使用隔离的 gateway worker。`qa-channel` 默认并发度为 4，但不会超过所选场景数量。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。  
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不以失败退出码结束，请使用 `--allow-failures`。  
实时运行会转发适合 guest 使用的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 可以通过挂载的工作区写回内容。

## 由仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的分类、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用且跨领域。例如，Markdown 场景可以组合传输侧辅助工具与浏览器侧辅助工具，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式控制 UI，而无需添加特例运行器。

场景文件应按产品能力分组，而不是按源码树文件夹分组。即使文件移动，也要保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来实现实现层面的可追溯性。

基线列表应足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 具有两个本地提供商 mock 通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是由仓库支持的 QA 和一致性验证的默认确定性 mock 通道。
- `aimock` 会启动一个由 AIMock 支持的提供商服务器，用于实验性协议、夹具、录制/回放和混沌测试覆盖。它是增量补充，不会替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商都负责自己的默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享 suite 和 gateway 代码应通过提供商注册表进行路由，而不是根据提供商名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景提供一个通用传输接缝。  
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来无论是真实渠道还是合成渠道，都应接入同一个 suite 运行器，而不是新增特定于传输协议的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告生成。
- 传输适配器负责 gateway 配置、就绪性、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

面向维护者的新渠道适配器接入指南位于 [测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。  
该报告应回答：

- 哪些内容成功了
- 哪些内容失败了
- 哪些内容仍然受阻
- 值得补充哪些后续场景

对于角色和风格检查，可让同一场景在多个实时模型引用上运行，并输出一份经评审的 Markdown 报告：

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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在接受评估。该命令会保留每份完整转录、记录基础运行统计信息，然后让评审模型以 fast 模式和 `xhigh` 推理来按自然度、氛围和幽默感对这些运行进行排序。  
在比较不同提供商时，请使用 `--blind-judge-models`：评审提示仍会收到每份转录和运行状态，但候选引用会被替换为 `candidate-01` 之类的中性标签；在解析完成后，报告会将排序结果映射回真实引用。  
候选运行默认使用 `high` thinking，而支持的 OpenAI 模型默认使用 `xhigh`。你可以用 `--model provider/model,thinking=<level>` 为特定候选单独覆盖。`--thinking <level>` 仍可设置全局后备值，而旧的 `--model-thinking <provider/model=level>` 形式也会为了兼容性而保留。  
OpenAI 候选引用默认使用 fast 模式，以便在提供商支持时使用优先处理。若某个候选或评审需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想为所有候选模型强制启用 fast 模式时，才传递 `--fast`。报告中会记录候选和评审的耗时，以供基准分析，但评审提示会明确说明不要根据速度进行排序。  
候选和评审模型运行的默认并发度都是 16。如果提供商限制或本地 gateway 压力导致运行噪声过大，请降低 `--concurrency` 或 `--judge-concurrency`。  
当未传递候选 `--model` 时，角色评估默认使用 `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。  
当未传递 `--judge-model` 时，评审默认使用 `openai/gpt-5.4,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
