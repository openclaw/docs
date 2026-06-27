---
read_when:
    - 运行本地个人智能体可靠性检查
    - 扩展由仓库支持的 QA 场景目录
    - 验证提醒、回复、记忆、隐去、安全工具跟进、任务状态、可安全共享的诊断、由证据支持的完成声明和故障恢复
summary: 用于隐私保护型个人助手工作流检查的本地 qa-channel 场景。
title: 个人智能体基准测试包
x-i18n:
    generated_at: "2026-06-27T01:52:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

个人智能体基准包是一个由小型仓库支持的 QA 场景包，用于
本地个人助理工作流。它不是通用模型基准，
也不需要新的运行器。该包复用了
[QA overview](/zh-CN/concepts/qa-e2e-automation) 中描述的私有 QA 栈、合成的
[QA channel](/zh-CN/channels/qa-channel)，以及现有的 `qa/scenarios` YAML
目录。

第一个包有意保持范围较窄：

- 通过本地 cron 投递模拟个人提醒
- 通过 `qa-channel` 模拟私信和线程回复路由
- 从临时 QA 工作区记忆文件中模拟偏好回忆
- 模拟秘密不回显检查
- 在短暂的审批式轮次后，执行由安全读取支撑的工具跟进
- 针对敏感本地读取请求的审批拒绝停止行为
- 有证明支撑的任务状态报告，保持待处理、受阻和已完成相互分离
- 可安全分享的诊断工件，在保留有用状态的同时省略原始个人内容
- 有证明支撑的完成声明，避免在本地证据存在前伪造进度
- 故障恢复，报告部分状态并保持重试边界清晰

## 场景

机器可读的包元数据位于
`extensions/qa-lab/src/scenario-packs.ts`。使用
`--pack personal-agent` 运行该包：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 可以与重复的 `--scenario` 标志叠加使用。显式场景会先运行，
然后包场景会按 `QA_PERSONAL_AGENT_SCENARIO_IDS` 顺序运行，并移除重复项。

该包为使用 `mock-openai` 或其他本地 QA 提供商通道的 `qa-channel` 设计。
不应将它指向实时聊天服务或真实个人账号。

## 隐私模型

这些场景只使用模拟用户、模拟偏好、模拟秘密，以及套件创建的
临时 QA Gateway 网关工作区。它们不得读取或写入真实的 OpenClaw 用户记忆、
会话、凭据、启动代理、全局配置或实时 Gateway 网关状态。

工件保留在现有 QA 套件工件目录下，应像测试输出一样处理。
脱敏检查使用模拟标记，因此失败可以安全检查并提交到 issue 中。

## 扩展该包

在 `qa/scenarios/personal/` 下添加新的 `.yaml` 用例，然后将场景 ID
添加到 `QA_PERSONAL_AGENT_SCENARIO_IDS`。保持每个用例小型、本地、
在 `mock-openai` 中确定性，并聚焦一个个人助理行为。

不错的后续候选项：

- 脱敏后的轨迹导出检查
- 仅本地插件工作流检查

在场景目录拥有足够稳定的用例来证明这些表面有必要之前，避免添加新的运行器、插件、依赖项、实时传输或模型裁判。
