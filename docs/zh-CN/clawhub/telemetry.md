---
read_when:
    - 正在处理遥测 / 隐私控制
    - 关于收集哪些数据的问题
summary: ClawHub CLI 收集的安装遥测以及如何选择退出。
x-i18n:
    generated_at: "2026-07-04T20:24:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 遥测

ClawHub 使用最少量的 CLI 遥测来计算聚合安装计数。

## 收集遥测的时机

只有在以下情况下才会发送遥测：

- 你已在 CLI 中登录。
- 你运行 `clawhub install <slug>`。
- 遥测**未被禁用**（见下方“如何禁用”）。

如果你未登录，则不会上报任何内容。

## 我们收集什么

每次上报的 `clawhub install`，CLI 都会发送一个尽力而为的安装事件。

该事件包括：

- `slug`：已安装技能的 slug。
- `version`：已安装版本（如果已知）。

### 我们_不会_收集什么

- 不收集文件夹路径或从文件夹派生的标识符。
- 不收集文件内容。
- 不收集每次运行的日志、提示词或其他 CLI 输出。

## 安装计数

ClawHub 会按技能维护聚合计数器：

- `installsAllTime`：至少上报过一次该技能 CLI 安装的唯一用户。
- `installsCurrent`：上报过安装且尚未删除其遥测的唯一用户。

## 透明度 + 用户控制

所有人只能看到**聚合安装计数器**。

删除你的账户也会删除你的遥测数据。

## 如何禁用遥测

设置环境变量：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

设置后，CLI 将不会发送安装遥测。
