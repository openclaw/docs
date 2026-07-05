---
read_when:
    - 运行本地个人智能体可靠性检查
    - 扩展由仓库支持的 QA 场景目录
    - 验证提醒、回复、记忆、脱敏、安全工具跟进执行、任务状态、可安全分享的诊断、由证据支持的完成声明，以及故障恢复
summary: 用于隐私保护型个人助手工作流检查的本地 qa-channel 场景。
title: 个人智能体基准测试包
x-i18n:
    generated_at: "2026-07-05T11:13:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

个人智能体基准测试包是一个由仓库支撑的小型 QA 场景包，用于本地个人助理工作流。它不是通用模型基准测试，也不需要新的运行器：它复用私有 QA 栈（[QA overview](/zh-CN/concepts/qa-e2e-automation)）、合成 [QA channel](/zh-CN/channels/qa-channel)，以及现有的 `qa/scenarios` YAML 目录。

## 场景

十个场景，定义在 `qa/scenarios/personal/*.yaml` 中：

| 场景 id                                    | 检查项                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | 通过本地 cron 投递模拟个人提醒                                                               |
| `personal-channel-thread-reply`            | 通过 `qa-channel` 模拟私信和线程回复路由                                                     |
| `personal-memory-preference-recall`        | 从临时 QA 工作区记忆文件中模拟偏好回忆                                                       |
| `personal-redaction-no-secret-leak`        | 模拟机密不回显检查                                                                           |
| `personal-tool-safety-followthrough`       | 在一个简短的类似审批轮次之后，进行基于安全读取的工具跟进                                     |
| `personal-approval-denial-stop`            | 针对敏感本地读取请求的审批拒绝停止行为                                                       |
| `personal-task-followthrough-status`       | 有证据支撑的任务状态报告，将待处理、受阻和已完成保持分离                                     |
| `personal-share-safe-diagnostics-artifact` | 可安全共享的诊断工件，在保留有用状态的同时省略原始个人内容                                   |
| `personal-no-fake-progress`                | 有证据支撑的完成声明，在本地证据存在之前避免虚假进度                                         |
| `personal-failure-recovery`                | 故障恢复，报告部分状态并保持重试边界清晰                                                     |

机器可读的包元数据（id 列表、标题、描述）位于 `extensions/qa-lab/src/scenario-packs.ts` 中，名称为 `QA_PERSONAL_AGENT_SCENARIO_IDS`。
使用 `--pack personal-agent` 运行该包：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 可与重复的 `--scenario` 标志叠加使用。显式场景会先运行，然后包内场景会按 `QA_PERSONAL_AGENT_SCENARIO_IDS` 顺序运行，并移除重复项。

该包以 `qa-channel` 为目标，使用 `mock-openai` 或其他本地 QA 提供商通道。不要将它指向实时聊天服务或真实个人账号。

## 隐私模型

场景只使用模拟用户、模拟偏好、模拟机密，以及由套件创建的临时 QA Gateway 网关工作区。它们不得读取或写入真实的 OpenClaw 用户记忆、会话、凭证、启动智能体、全局配置或实时 Gateway 网关状态。

工件保留在现有 QA 套件工件目录下，并按测试输出处理。脱敏检查使用模拟标记，因此可以安全地检查失败并将其提交到 issue。

## 扩展该包

在 `qa/scenarios/personal/` 下添加新的 `.yaml` 用例，然后将场景 id 添加到 `QA_PERSONAL_AGENT_SCENARIO_IDS`。保持每个用例小型、本地、在 `mock-openai` 中确定性，并聚焦一个个人助理行为。

适合作为后续工作的候选项：脱敏轨迹导出检查、仅本地插件工作流检查。

在场景目录拥有足够多稳定用例、足以证明新增表面合理之前，避免添加新的运行器、插件、依赖、实时传输或模型裁判。
