---
read_when:
    - 正在处理遥测 / 隐私控制
    - 关于收集哪些数据的问题
summary: ClawHub CLI 收集的安装遥测信息以及如何选择退出。
x-i18n:
    generated_at: "2026-07-01T20:12:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 遥测

ClawHub 使用最少量的 CLI 遥测来计算汇总安装次数。

## 何时收集遥测

仅在以下情况下发送遥测：

- 你已在 CLI 中登录。
- 你运行 `clawhub install <slug>`。
- 遥测**未被禁用**（见下方“如何禁用”）。

如果你未登录，则不会报告任何内容。

## 我们收集什么

每次报告的 `clawhub install`，CLI 都会发送一个尽力而为的安装事件。

该事件包括：

- `slug`：已安装 skill 的 slug。
- `version`：已安装版本（如果已知）。

### 我们_不会_收集什么

- 不收集文件夹路径或从文件夹派生的标识符。
- 不收集文件内容。
- 不收集每次运行的日志、提示词或其他 CLI 输出。

## 安装次数

ClawHub 按 skill 维护汇总计数器：

- `installsAllTime`：曾报告过至少一次该 skill CLI 安装的唯一用户数。
- `installsCurrent`：曾报告过一次安装且尚未删除其
  遥测的唯一用户数。

## 透明度 + 用户控制

所有人只能看到**汇总安装计数器**。

删除你的账户也会删除你的遥测数据。

## 如何禁用遥测

设置环境变量：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

设置后，CLI 不会发送安装遥测。
