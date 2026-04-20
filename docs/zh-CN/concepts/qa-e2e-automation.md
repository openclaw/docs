---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加仓库支撑的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-20T02:15:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 技术栈旨在以比单个单元测试更贴近真实、渠道形态化的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，提供私信、频道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息以及导出 Markdown 报告。
- `qa/`：为启动任务和基线 QA 场景提供仓库支撑的种子资源。

当前 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录记录和场景计划。

运行方式如下：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实渠道行为，并记录哪些工作正常、哪些失败了、哪些仍然受阻。

如果想更快地迭代 QA Lab UI，而不是每次都重建 Docker 镜像，可使用带有绑定挂载 QA Lab bundle 的方式启动技术栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务基于预构建镜像运行，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，而当 QA Lab 资源哈希变更时，浏览器会自动重新加载。

如需运行一个基于真实传输的 Matrix 冒烟通道，可执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中预置一个一次性的 Tuwunel homeserver，注册临时的驱动、SUT 和观察者用户，创建一个私有房间，然后在一个 QA Gateway 网关子进程中运行真实的 Matrix 插件。实时传输通道会将子配置限定在待测传输范围内，因此 Matrix 会在子配置中不包含 `qa-channel` 的情况下运行。它会将结构化报告产物以及合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若还想捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内本地日志文件路径。

如需运行一个基于真实传输的 Telegram 冒烟通道，可执行：

```bash
pnpm openclaw qa telegram
```

该通道会面向一个真实的私有 Telegram 群组，而不是预置一次性服务器。它要求设置 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人对机器人的观察效果最佳。  
当任何场景失败时，该命令会以非零状态退出。如果你希望保留产物而不使用失败退出码，请使用 `--allow-failures`。

实时传输通道现在共享一个更小的统一契约，而不是各自定义自己的场景列表结构：

`qa-channel` 仍然是广泛的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | 允许列表拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | help 命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

这使得 `qa-channel` 继续作为广泛的产品行为套件，而 Matrix、Telegram 以及未来的实时传输共享同一份明确的传输契约检查清单。

如果你想运行一个一次性的 Linux VM 通道，而不将 Docker 纳入 QA 路径，可执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。  
它会复用与宿主机上 `qa suite` 相同的场景选择行为。宿主机和 Multipass 的套件运行默认都会以隔离的 Gateway 网关 worker 并行执行多个选中的场景。`qa-channel` 默认并发度为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。  
当任何场景失败时，该命令会以非零状态退出。如果你希望保留产物而不使用失败退出码，请使用 `--allow-failures`。  
实时运行会转发那些对 guest 来说实际可用的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区写回结果。

## 仓库支撑的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，以便人类和智能体都能看到 QA 计划。

`qa-lab` 应保持为一个通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，应定义以下内容：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件需求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用且跨领域。例如，Markdown 场景可以组合传输侧辅助函数和浏览器侧辅助函数，通过 Gateway 网关的 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特定场景运行器。

场景文件应按产品能力分组，而不是按源代码树目录分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来追踪实现。

基线列表应保持足够广泛，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体移交
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是面向场景的 OpenClaw mock。它仍然是用于仓库支撑 QA 和一致性门禁的默认确定性 mock 通道。
- `aimock` 会启动一个基于 AIMock 的提供商服务器，用于实验性的协议、夹具、录制/回放和混沌覆盖。它是增量补充，不替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商都拥有自己的默认值、本地服务器启动逻辑、Gateway 网关模型配置、auth profile 暂存需求，以及实时/mock 能力标志。共享套件和 Gateway 网关代码应通过提供商注册表进行路由，而不是基于提供商名称分支。

## 传输适配器

`qa-lab` 拥有一个面向 Markdown QA 场景的通用传输接缝。  
`qa-channel` 是这一接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道都应接入同一个套件运行器，而不是再增加一个特定于传输的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站观察、传输动作以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

面向维护者的新渠道适配器接入指南位于  
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会基于观察到的总线时间线导出一份 Markdown 协议报告。  
该报告应回答：

- 哪些工作正常
- 哪些失败了
- 哪些仍然受阻
- 值得补充哪些后续场景

对于角色和风格检查，可在多个实时模型引用上运行同一场景，并写出一份经过评审的 Markdown 报告：

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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后执行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在被评估。该命令会保留每一份完整转录，记录基本运行统计信息，然后以 fast 模式和 `xhigh` 推理让评审模型按自然度、氛围感和幽默感对这些运行结果排序。  
在比较提供商时，请使用 `--blind-judge-models`：评审提示词仍然会获得每份转录和运行状态，但候选引用会被替换为中性标签，如 `candidate-01`；报告会在解析后将排序结果映射回真实引用。  
候选运行默认使用 `high` thinking，而支持的 OpenAI 模型则默认使用 `xhigh`。可通过 `--model provider/model,thinking=<level>` 内联覆盖某个特定候选。`--thinking <level>` 仍会设置全局回退值，而旧的 `--model-thinking <provider/model=level>` 形式则保留用于兼容。  
OpenAI 候选引用默认启用 fast 模式，以便在提供商支持时使用优先处理。若单个候选或评审需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型强制启用 fast 模式时，才传递 `--fast`。报告中会记录候选和评审的时长以供基准分析，但评审提示词会明确说明不要按速度排名。  
候选和评审模型运行默认并发度均为 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。  
当未传递候选 `--model` 时，角色评估默认使用 `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。  
当未传递 `--judge-model` 时，评审默认使用 `openai/gpt-5.4,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
